import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export async function PATCH(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const { id } = params;
    const body = await request.json();
    const { ban_mostrar } = body;

    if (!['S', 'N'].includes(ban_mostrar)) {
      return NextResponse.json({ success: false, error: 'Valor inválido para ban_mostrar' }, { status: 400 });
    }

    await query(`
      UPDATE "notarioElite".preguntas
      SET ban_mostrar = $1
      WHERE id = $2
    `, [ban_mostrar, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pregunta:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
