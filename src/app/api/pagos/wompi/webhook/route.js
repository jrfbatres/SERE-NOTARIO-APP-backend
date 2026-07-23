import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const payload = await request.json();

    console.log("Webhook de Wompi recibido:", payload.IdTransaccion, payload.ResultadoTransaccion);

    // Extraemos campos clave del webhook defensivamente
    const idTransaccion = payload?.IdTransaccion ? String(payload.IdTransaccion) : null;
    const resultadoTransaccion = payload?.ResultadoTransaccion ? String(payload.ResultadoTransaccion) : null;
    
    // Convertimos monto a número independientemente de si Wompi lo manda como string o number
    let monto = 0;
    if (payload?.Monto !== undefined && payload?.Monto !== null) {
      monto = parseFloat(String(payload.Monto)) || 0;
    }
    
    // Forzamos booleano por si envían string "false"/"true"
    const esProductiva = payload?.EsProductiva === true || String(payload?.EsProductiva).toLowerCase() === 'true';
    
    // Uso de optional chaining (?.) por si EnlacePago desaparece o cambia
    const identificadorEnlace = payload?.EnlacePago?.IdentificadorEnlaceComercio 
      ? String(payload.EnlacePago.IdentificadorEnlaceComercio) 
      : null;

    // Guardamos la transacción en la base de datos (historial en bruto)
    // El payload se inserta completo como JSON, si agregan campos extra Postgres lo acepta igual
    await query(
      `INSERT INTO wompi_transactions 
        (id_transaccion, identificador_enlace_comercio, monto, resultado_transaccion, es_productiva, payload) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        idTransaccion,
        identificadorEnlace,
        monto,
        resultadoTransaccion,
        esProductiva,
        payload
      ]
    );

    if (resultadoTransaccion === "ExitosaAprobada" && identificadorEnlace) {
      // 1. Buscamos el registro pendiente en usuario_pagos
      const pagoResult = await query(
        `SELECT * FROM usuario_pagos WHERE identificador_enlace = $1 AND estado = 'PENDIENTE'`,
        [identificadorEnlace]
      );

      if (pagoResult.rows.length > 0) {
        const pago = pagoResult.rows[0];
        const usuarioId = pago.usuario_id;
        const mesesDuracion = pago.meses_duracion || 1; // Default 1 mes si no hay

        // 2. Actualizamos usuario_pagos
        await query(
          `UPDATE usuario_pagos 
           SET estado = 'PAGADO', 
               fecha_pago = NOW(),
               fecha_vencimiento = NOW() + ($1 || ' months')::interval
           WHERE id = $2`,
          [mesesDuracion, pago.id]
        );

        // 3. Calculamos la bandera de nodos libres y el plan de estudio
        let banNodosLibres = 'N';
        let banPlan = 'B'; // Default to Lite
        const montoNum = parseFloat(monto);
        
        if (montoNum === 10) {
          banNodosLibres = 'S';
          banPlan = 'P'; // Profundo
        } else if (montoNum === 15) {
          banNodosLibres = 'S';
          banPlan = 'C'; // Completo
        } else if (montoNum === 5) {
          banNodosLibres = 'N';
          banPlan = 'B'; // Lite
        } else if (montoNum === 20 || montoNum === 80) {
          // Fallback legacy values
          banNodosLibres = 'S';
          banPlan = 'C';
        }

        // 4. Actualizamos la tabla maestra de usuarios
        await query(
          `UPDATE usuarios 
           SET fecha_pago = NOW(),
               fecha_vence = NOW() + ($1 || ' months')::interval,
               ban_pago = 'S',
               ban_nodos_libres = $2,
               ban_plan = $3
           WHERE id = $4`,
          [mesesDuracion, banNodosLibres, banPlan, usuarioId]
        );

        console.log(`Plan activado correctamente para el usuario ${usuarioId}.`);
      } else {
        console.warn(`No se encontró un pago PENDIENTE para el identificador: ${identificadorEnlace}`);
      }
    }

    // Wompi espera un código 200 OK para confirmar que recibimos el webhook
    return NextResponse.json({ success: true, message: 'Webhook recibido y procesado correctamente' }, { status: 200 });

  } catch (error) {
    console.error('Error procesando el webhook de Wompi:', error);
    return NextResponse.json({ error: 'Error procesando el webhook' }, { status: 500 });
  }
}
