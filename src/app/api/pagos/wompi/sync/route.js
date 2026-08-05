import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { sincronizarPagosUsuario } from '@/lib/wompi';

export async function POST(request) {
  try {
    const usuarioId = getUserIdFromRequest(request);
    if (!usuarioId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await sincronizarPagosUsuario(usuarioId);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en sync de Wompi:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}

