import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { getWompiToken } from '@/lib/wompi';

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

export async function GET(request) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha'); // Expect YYYY-MM-DD

    let sql = `
      SELECT p.*, u.nombre AS usuario_nombre, u.correo AS usuario_correo
      FROM public.usuario_pagos p
      JOIN "notarioElite".usuarios u ON p.usuario_id = u.id
    `;
    const params = [];

    if (fecha) {
      sql += ` WHERE p.fecha_creacion::date = $1`;
      params.push(fecha);
    }

    sql += ` ORDER BY p.fecha_creacion DESC`;

    const result = await query(sql, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { pagoId } = body;

    if (!pagoId) {
      return NextResponse.json({ error: 'Falta pagoId' }, { status: 400 });
    }

    // Buscar el pago por ID
    const pagoRes = await query(
      `SELECT * FROM public.usuario_pagos WHERE id = $1`,
      [pagoId]
    );

    if (pagoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 444 });
    }

    const pago = pagoRes.rows[0];

    if (!pago.id_wompi) {
      return NextResponse.json({ error: 'El pago no cuenta con un id_wompi para verificación externa.' }, { status: 400 });
    }

    const token = await getWompiToken();
    const response = await fetch(`https://api.wompi.sv/EnlacePago/${pago.id_wompi}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Error al consultar Wompi API' }, { status: 502 });
    }

    const data = await response.json();
    const pagado = data.cantidadPagosExitosos && data.cantidadPagosExitosos > 0;

    if (pagado) {
      const mesesDuracion = pago.meses_duracion || 1;

      // 1. Actualizar public.usuario_pagos
      await query(
        `UPDATE public.usuario_pagos 
         SET estado = 'PAGADO', 
             fecha_pago = NOW(),
             fecha_vencimiento = NOW() + ($1 || ' months')::interval
         WHERE id = $2`,
        [mesesDuracion, pago.id]
      );

      // 2. Determinar plan y nodos libres
      let banNodosLibres = 'N';
      let banPlan = 'B';
      const montoNum = parseFloat(pago.monto);

      if (montoNum === 10) {
        banNodosLibres = 'S';
        banPlan = 'P';
      } else if (montoNum === 15) {
        banNodosLibres = 'S';
        banPlan = 'C';
      } else if (montoNum === 5) {
        banNodosLibres = 'N';
        banPlan = 'B';
      } else if (montoNum === 20 || montoNum === 80) {
        banNodosLibres = 'S';
        banPlan = 'C';
      }

      // 3. Actualizar tabla de usuarios
      await query(
        `UPDATE "notarioElite".usuarios 
         SET fecha_pago = NOW(),
             fecha_vence = NOW() + ($1 || ' months')::interval,
             ban_pago = 'S',
             ban_nodos_libres = $2,
             ban_plan = $3
         WHERE id = $4`,
        [mesesDuracion, banNodosLibres, banPlan, pago.usuario_id]
      );

      return NextResponse.json({ 
        success: true, 
        pagado: true, 
        message: 'Pago verificado como Exitoso. Usuario y pago actualizados a PAGADO.',
        data: { ...pago, estado: 'PAGADO', fecha_pago: new Date() }
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        pagado: false, 
        message: 'El pago en Wompi aún se encuentra pendiente o sin transacciones exitosas.',
        data: pago
      });
    }
  } catch (error) {
    console.error('Error syncing payment as admin:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
