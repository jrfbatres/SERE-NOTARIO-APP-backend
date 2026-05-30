import { NextResponse } from 'next/server';
import { getWompiToken, getWompiCredentials } from '@/lib/wompi';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    // Autenticación via JWT
    const usuarioId = getUserIdFromRequest(request);
    if (!usuarioId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtenemos los parámetros desde el Frontend
    const body = await request.json();
    const { 
      monto, 
      nombreProducto, 
      descripcionProducto,
      mesesDuracion,
      urlRedirect
    } = body;

    // Validación básica
    if (!monto || !nombreProducto || !mesesDuracion) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (monto, nombreProducto, mesesDuracion)' }, 
        { status: 400 }
      );
    }

    // Construimos el identificador único para rastrear al usuario en el webhook
    const identificadorEnlaceComercio = `USR-${usuarioId}-TS-${Date.now()}`;

    // Obtenemos las credenciales (para url_serenotario, url_webhook) y el token
    const credenciales = await getWompiCredentials();
    const token = await getWompiToken();

    // Calculamos las fechas (Restando 6 horas para sincronizar la zona horaria UTC con El Salvador y evitar "Enlace Vencido")
    const now = new Date();
    const fechaInicio = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const fechaFin = new Date(fechaInicio.getTime() + 24 * 60 * 60 * 1000); // +1 día

    // urls por defecto usando las de la base de datos si existen, de lo contrario la que venga por parametro
    const finalUrlRedirect = urlRedirect || credenciales.url_serenotario || "https://sere-notario.vercel.app";
    const finalUrlWebhook = credenciales.url_webhook || "https://sere-notario.vercel.app/api/pagos/wompi/webhook";

    // Preparamos el payload exacto de Wompi
    const payload = {
      identificadorEnlaceComercio: identificadorEnlaceComercio,
      monto: parseFloat(monto),
      nombreProducto: nombreProducto,
      formaPago: {
        permitirTarjetaCreditoDebido: true,
        permitirPagoConPuntoAgricola: true,
        permitirPagoEnCuotasAgricola: false,
        permitirPagoEnBitcoin: true,
        permitePagoQuickPay: true,
      },
      infoProducto: {
        descripcionProducto: descripcionProducto || nombreProducto
      },
      configuracion: {
        urlRedirect: finalUrlRedirect,
        esMontoEditable: false,
        esCantidadEditable: false,
        cantidadPorDefecto: 1,
        duracionInterfazIntentoMinutos: 15,
        urlRetorno: finalUrlRedirect,
        emailsNotificacion: "", // Puedes agregar tu correo aquí
        urlWebhook: finalUrlWebhook,
        telefonosNotificacion: "",
        notificarTransaccionCliente: true
      },
      vigencia: {
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString()
      },
      limitesDeUso: {
        cantidadMaximaPagosExitosos: 1,
        cantidadMaximaPagosFallidos: 3
      },
      // idGrupoTarjetas: "string" // Opcional
    };

    // Petición a Wompi para crear el enlace
    const response = await fetch('https://api.wompi.sv/EnlacePago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      data = { message: responseText };
    }

    if (!response.ok) {
      console.error("Error desde Wompi:", data);
      return NextResponse.json({ error: 'Error al crear enlace en Wompi', details: data }, { status: response.status });
    }

    // Registramos en base de datos la intención de pago
    await query(
      `INSERT INTO usuario_pagos (usuario_id, identificador_enlace, url_enlace, monto, nombre_producto, meses_duracion, estado, id_wompi)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', $7)`,
      [usuarioId, identificadorEnlaceComercio, data.urlEnlace, monto, nombreProducto, mesesDuracion, data.idEnlace]
    );

    // Retornamos el link generado y la data
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en ruta de Wompi:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
