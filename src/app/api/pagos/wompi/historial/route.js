import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const usuarioId = getUserIdFromRequest(request);
    if (!usuarioId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar el historial de pagos del usuario
    const result = await query(
      `SELECT id, identificador_enlace, url_enlace, monto, nombre_producto, estado, fecha_creacion, fecha_pago, meses_duracion
       FROM usuario_pagos 
       WHERE usuario_id = $1 
       ORDER BY fecha_creacion DESC`,
      [usuarioId]
    );

    const historial = result.rows.map(row => {
      // Determinamos si un estado PENDIENTE está vencido (más de 24 horas)
      const ahora = new Date();
      const creado = new Date(row.fecha_creacion);
      const horasPasadas = (ahora - creado) / (1000 * 60 * 60);
      
      let estadoActual = row.estado;
      let urlValida = true;

      if (estadoActual === 'PENDIENTE' && horasPasadas >= 24) {
        estadoActual = 'VENCIDO';
        urlValida = false;
      }

      return {
        id: row.id,
        identificador: row.identificador_enlace,
        urlEnlace: row.url_enlace,
        monto: row.monto,
        producto: row.nombre_producto,
        estado: estadoActual,
        fechaCreacion: row.fecha_creacion,
        fechaPago: row.fecha_pago,
        urlValida: urlValida
      };
    });

    return NextResponse.json({ historial });

  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
