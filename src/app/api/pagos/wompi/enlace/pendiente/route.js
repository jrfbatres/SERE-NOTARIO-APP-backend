import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const montoStr = searchParams.get('monto');
    const mesesDuracionStr = searchParams.get('mesesDuracion');

    const usuarioId = getUserIdFromRequest(request);
    if (!usuarioId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!montoStr) {
      return NextResponse.json({ error: 'Falta el monto del plan' }, { status: 400 });
    }

    const monto = parseFloat(montoStr);

    // Buscar si existe un enlace PENDIENTE creado en las últimas 24 horas para este usuario y monto
    const result = await query(
      `SELECT * FROM usuario_pagos 
       WHERE usuario_id = $1 
         AND monto = $2 
         AND estado = 'PENDIENTE' 
         AND fecha_creacion >= NOW() - INTERVAL '24 hours'
       ORDER BY fecha_creacion DESC 
       LIMIT 1`,
      [usuarioId, monto]
    );

    if (result.rows.length > 0) {
      // Devolvemos el link que ya existe
      return NextResponse.json({
        existe: true,
        enlace: {
          urlEnlace: result.rows[0].url_enlace,
          identificadorEnlaceComercio: result.rows[0].identificador_enlace,
          monto: result.rows[0].monto,
          fechaCreacion: result.rows[0].fecha_creacion
        }
      });
    }

    // No hay enlace válido pendiente
    return NextResponse.json({ existe: false });

  } catch (error) {
    console.error('Error buscando enlace pendiente:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
