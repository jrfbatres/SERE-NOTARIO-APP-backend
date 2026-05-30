import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { getWompiToken } from '@/lib/wompi';

export async function POST(request) {
  try {
    const usuarioId = getUserIdFromRequest(request);
    if (!usuarioId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar pagos pendientes que tengan id_wompi
    const pendientesRes = await query(
      `SELECT * FROM usuario_pagos 
       WHERE usuario_id = $1 
         AND estado = 'PENDIENTE' 
         AND id_wompi IS NOT NULL`,
      [usuarioId]
    );

    const pendientes = pendientesRes.rows;
    let actualizados = 0;

    if (pendientes.length === 0) {
      return NextResponse.json({ success: true, actualizados: 0, message: "No hay pagos pendientes sincronizables." });
    }

    const token = await getWompiToken();

    for (const pago of pendientes) {
      try {
        // Consultar el estado en Wompi
        const response = await fetch(`https://api.wompi.sv/EnlacePago/${pago.id_wompi}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Si la cantidad de pagos exitosos es mayor a 0, significa que se pagó
          if (data.cantidadPagosExitosos && data.cantidadPagosExitosos > 0) {
            
            const mesesDuracion = pago.meses_duracion || 1;
            
            // 1. Actualizar usuario_pagos
            await query(
              `UPDATE usuario_pagos 
               SET estado = 'PAGADO', 
                   fecha_pago = NOW(),
                   fecha_vencimiento = NOW() + ($1 || ' months')::interval
               WHERE id = $2`,
              [mesesDuracion, pago.id]
            );

            // 2. Calcular ban_nodos_libres
            let banNodosLibres = 'N';
            const montoNum = parseFloat(pago.monto);
            if (montoNum === 20 || montoNum === 80) {
              banNodosLibres = 'S';
            }

            // 3. Actualizar maestro de usuarios
            await query(
              `UPDATE usuarios 
               SET fecha_pago = NOW(),
                   fecha_vence = NOW() + ($1 || ' months')::interval,
                   ban_pago = 'S',
                   ban_nodos_libres = $2
               WHERE id = $3`,
              [mesesDuracion, banNodosLibres, usuarioId]
            );

            actualizados++;
          }
        }
      } catch (err) {
        console.error(`Error sincronizando el pago ${pago.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, actualizados });

  } catch (error) {
    console.error('Error en sync de Wompi:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
