import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

// Helper to check if requesting user is administrator
async function checkAdmin(request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return null;

  const res = await query(
    `SELECT rol, correo FROM "notarioElite".usuarios WHERE id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  
  const isAdmin = user.correo === 'admin@serenotario.com' || user.rol === 'Administrador' || user.rol === 'ADMINISTRADOR';
  return isAdmin ? userId : null;
}

export async function POST(request) {
  try {
    const adminId = await checkAdmin(request);
    if (!adminId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { usuarioId, planMonto } = await request.json();

    if (!usuarioId || !planMonto) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos (usuario o plan).' }, { status: 400 });
    }

    const montoNum = parseFloat(planMonto);
    let banNodosLibres = 'N';
    let banPlan = 'B'; 
    let mesesDuracion = 1;

    // Determinar plan y duración basados en el monto
    if (montoNum === 10) {
      banNodosLibres = 'S';
      banPlan = 'P'; // Profundo
      mesesDuracion = 3;
    } else if (montoNum === 15) {
      banNodosLibres = 'S';
      banPlan = 'C'; // Premium (Completo)
      mesesDuracion = 3;
    } else if (montoNum === 5) {
      banNodosLibres = 'N';
      banPlan = 'B'; // Lite
      mesesDuracion = 1;
    } else {
      return NextResponse.json({ success: false, error: 'Monto de plan inválido.' }, { status: 400 });
    }

    // Insertar registro en usuario_pagos
    await query(
      `INSERT INTO public.usuario_pagos 
       (usuario_id, monto, estado, fecha_pago, fecha_vencimiento, meses_duracion)
       VALUES ($1, $2, 'PAGADO', NOW(), NOW() + $3::interval, $4)`,
      [usuarioId, montoNum, `${mesesDuracion} months`, mesesDuracion]
    );

    // Actualizar usuario en tabla maestro
    await query(
      `UPDATE "notarioElite".usuarios 
       SET fecha_pago = NOW(),
           fecha_vence = NOW() + $1::interval,
           ban_pago = 'S',
           ban_plan = $2
       WHERE id = $3`,
      [`${mesesDuracion} months`, banPlan, usuarioId]
    );

    return NextResponse.json({ success: true, message: 'Pago manual registrado correctamente y usuario actualizado.' });
  } catch (error) {
    console.error('Error registrando pago manual:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
