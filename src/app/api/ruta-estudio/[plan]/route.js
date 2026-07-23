import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export async function GET(request, { params }) {
  console.log("== API /api/ruta-estudio/[plan] LLAMADA ==");
  try {
    const resolvedParams = await params;
    const plan = resolvedParams.plan;
    console.log("Plan solicitado:", plan);
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // 0. Obtener detalles del usuario para control de acceso
    const userRes = await query(`
      SELECT rol, correo, ban_plan, fecha_vence, ban_fundador 
      FROM "notarioElite".usuarios 
      WHERE id = $1::uuid
    `, [userId]);

    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const user = userRes.rows[0];
    const now = new Date();
    const isAdmin = user.correo === 'admin@serenotario.com' || user.rol === 'Administrador';
    const isPrivileged = isAdmin || user.ban_fundador;

    // Verificar vigencia de suscripción
    if (!isPrivileged && (!user.fecha_vence || new Date(user.fecha_vence) < now)) {
      return NextResponse.json({ success: false, error: 'Tu suscripción ha vencido o está inactiva. Por favor, adquiere un plan de pago.' }, { status: 403 });
    }

    const userPlan = (user.ban_plan || '').toUpperCase();

    // Determinar el código del plan ('B' para express, 'P' para profundo, 'M' para magistral)
    let planCode = '';
    if (plan === 'express' || plan === 'lite') planCode = 'B';
    else if (plan === 'profundo') planCode = 'P';
    else if (plan === 'magistral') planCode = 'M';
    else {
      return NextResponse.json({ success: false, error: 'Plan no válido' }, { status: 400 });
    }

    // Control de acceso por plan de pago
    if (!isPrivileged && userPlan !== 'C') {
      if (planCode === 'B' && userPlan !== 'B') {
        return NextResponse.json({ 
          success: false, 
          error: 'Acceso Denegado. Tu suscripción activa es de plan Profundo. Para estudiar la ruta Express/Lite, adquiere el plan Completo (Acceso Total).' 
        }, { status: 403 });
      }
      if (planCode === 'P' && userPlan !== 'P') {
        return NextResponse.json({ 
          success: false, 
          error: 'Acceso Denegado. Tu suscripción activa es de plan Lite/Express. Para estudiar la ruta Profunda, adquiere el plan Profundo o Completo (Acceso Total).' 
        }, { status: 403 });
      }
    }

    // 1. Obtener el pensum
    const pensumRes = await query(`SELECT id, nombre, dias_totales FROM "notarioElite".pensum WHERE ban_plan = $1 LIMIT 1`, [planCode]);
    if (pensumRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Pensum no encontrado' }, { status: 404 });
    }
    const pensum = pensumRes.rows[0];

    // 2. Auto-migrar el progreso de usuario_nodos a nodo_dias_usuario si es el plan Lite ('B')
    // y el usuario aún no tiene progreso registrado en nodo_dias_usuario para este plan.
    const checkProgressRes = await query(`
      SELECT 1 FROM "notarioElite".nodo_dias_usuario 
      WHERE usuario_id = $1::uuid AND pensum_id = $2 
      LIMIT 1
    `, [userId, pensum.id]);

    if (checkProgressRes.rows.length === 0 && planCode === 'B') {
      console.log(`Auto-migrating progress for user ${userId} to Lite/Express pensum ${pensum.id}`);
      
      const unRes = await query(`
        SELECT * FROM "notarioElite".usuario_nodos 
        WHERE usuario_id = $1::uuid
      `, [userId]);

      for (const row of unRes.rows) {
        // Encontrar la asignación del día y cantidad de preguntas correspondientes al plan
        const pdRes = await query(`
          SELECT dia, cantidad_preguntas FROM "notarioElite".pensum_dia 
          WHERE pensum_id = $1 AND nodo_id = $2 
          LIMIT 1
        `, [pensum.id, row.nodo_id]);

        if (pdRes.rows.length > 0) {
          const pd = pdRes.rows[0];
          const totalBlocks = Math.ceil(pd.cantidad_preguntas / 5);

          await query(`
            INSERT INTO "notarioElite".nodo_dias_usuario (
              usuario_id, pensum_id, dia, nodo_id, ley_id, 
              bloque_actual, bloques_totales, nota, completado, 
              notas_bloques, fecha_estudio
            ) VALUES (
              $1::uuid, $2, $3, $4, $5, 
              $6, $7, $8, $9, 
              $10, $11
            ) ON CONFLICT (usuario_id, pensum_id, dia, nodo_id) DO NOTHING
          `, [
            row.usuario_id, pensum.id, pd.dia, row.nodo_id, row.ley_id,
            row.bloque_actual || 1, totalBlocks, row.nota, row.completado || false,
            row.notas_bloques || '{}', row.actualizado_en || new Date()
          ]);
        }
      }
    }

    // 3. Obtener el desglose de días
    const diasRes = await query(`
      SELECT dia, ley_id, nodo_id, cantidad_preguntas
      FROM "notarioElite".pensum_dia 
      WHERE pensum_id = $1 
      ORDER BY dia ASC
    `, [pensum.id]);

    // 4. Obtener el progreso del usuario desde nodo_dias_usuario unido a pensum_dia
    // Sin fallback a usuario_nodos para que los planes (Lite y Profundo) sean independientes
    const progresoRes = await query(`
      SELECT 
        pd.dia, 
        pd.nodo_id, 
        COALESCE(ndu.bloque_actual, 1) as bloque_actual, 
        CEIL(pd.cantidad_preguntas / 5.0)::integer as bloques_totales, 
        COALESCE(ndu.completado, false) as completado, 
        ndu.nota, 
        ndu.fecha_estudio
      FROM "notarioElite".pensum_dia pd
      LEFT JOIN "notarioElite".nodo_dias_usuario ndu 
        ON pd.dia = ndu.dia 
        AND pd.nodo_id = ndu.nodo_id 
        AND ndu.pensum_id = pd.pensum_id 
        AND ndu.usuario_id = $1::uuid
      WHERE pd.pensum_id = $2
    `, [userId, pensum.id]);

    const progresoMap = {};
    let globalStartDate = null;

    progresoRes.rows.forEach(p => {
      progresoMap[`${p.dia}-${p.nodo_id}`] = p;
      
      if (p.fecha_estudio) {
        const pDate = new Date(p.fecha_estudio).getTime();
        if (!globalStartDate || pDate < globalStartDate) {
          globalStartDate = pDate;
        }
      }
    });

    // 4. Cargar nombres de leyes y nodos (del JSON local o BD si estuviera ahí)
    const jsonPath = path.join(process.cwd(), 'leyes_nodos_data.json');
    let leyesData = { leyes: [], nodos: [] };
    if (fs.existsSync(jsonPath)) {
      leyesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }

    const getLeyName = (id) => leyesData.leyes.find(l => l.id == id)?.nombre || `Ley ${id}`;
    const getNodoName = (id) => leyesData.nodos.find(n => n.id == id)?.nombre || `Nodo ${id}`;

    // 5. Estructurar la respuesta agrupada por días
    const daysMap = {};
    for (let i = 1; i <= pensum.dias_totales; i++) {
      daysMap[i] = {
        dia: i,
        nodos: [],
        completado: true,
        fecha_estudio: null // Se asignará la fecha más antigua de sus nodos
      };
    }

    diasRes.rows.forEach(row => {
      const pId = `${row.dia}-${row.nodo_id}`;
      const prog = progresoMap[pId];
      
      if (prog && prog.fecha_estudio) {
        const nDate = new Date(prog.fecha_estudio).getTime();
        if (!daysMap[row.dia].fecha_estudio || nDate < daysMap[row.dia].fecha_estudio) {
          daysMap[row.dia].fecha_estudio = nDate;
        }
      }
      
      const bloquesTotalesCalculados = Math.ceil(row.cantidad_preguntas / 5);
      const totalBlocks = prog?.bloques_totales || bloquesTotalesCalculados;
      const nodeData = {
        ley_id: row.ley_id,
        ley_nombre: getLeyName(row.ley_id),
        nodo_id: row.nodo_id,
        nodo_nombre: getNodoName(row.nodo_id),
        cantidad_preguntas: row.cantidad_preguntas,
        bloques_totales: totalBlocks,
        bloque_actual: Math.min(prog?.bloque_actual || 1, totalBlocks),
        completado: prog?.completado || false,
        nota: prog?.nota || null
      };

      if (!nodeData.completado) {
        daysMap[row.dia].completado = false;
      }

      if (daysMap[row.dia]) {
        daysMap[row.dia].nodos.push(nodeData);
      }
    });

    // Si un día no tiene nodos (raro pero posible), considerarlo completado o vacío
    Object.values(daysMap).forEach(d => {
      if (d.nodos.length === 0) d.completado = false;
    });

    return NextResponse.json({
      success: true,
      pensum_id: pensum.id,
      pensum_nombre: pensum.nombre,
      dias_totales: pensum.dias_totales,
      fecha_inicio: globalStartDate || Date.now(),
      dias: Object.values(daysMap)
    });

  } catch (error) {
    console.error('Error fetching ruta estudio:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
