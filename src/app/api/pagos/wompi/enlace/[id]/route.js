import { NextResponse } from 'next/server';
import { getWompiToken } from '@/lib/wompi';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del enlace de pago' }, { status: 400 });
    }

    // Obtenemos el token de autenticación
    const token = await getWompiToken();

    // Consultamos a la API de Wompi
    const response = await fetch(`https://api.wompi.sv/EnlacePago/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      data = { message: responseText };
    }

    if (!response.ok) {
      console.error("Error al consultar Wompi:", data);
      return NextResponse.json({ error: 'Error al consultar el enlace en Wompi', details: data }, { status: response.status });
    }

    // Opcional: Si encontramos que el enlace tiene una transacción exitosa y en nuestra base sigue PENDIENTE,
    // podríamos actualizar el estado aquí mismo como un mecanismo de respaldo al webhook.
    // data.transacciones contiene el arreglo de intentos de pago si ya se realizaron.

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error consultando estado del enlace de Wompi:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
