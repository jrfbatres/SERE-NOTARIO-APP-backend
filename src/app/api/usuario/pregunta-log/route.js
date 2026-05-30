import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { pregunta_id, es_correcta, respuesta_usuario } = await request.json();

    if (!pregunta_id || es_correcta === undefined) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // Save individual question response
    await query(`
      INSERT INTO "notarioElite".usuario_preguntas (usuario_id, pregunta_id, es_correcta, respuesta_usuario, creado_en)
      VALUES ($1::uuid, $2::uuid, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (usuario_id, pregunta_id)
      DO UPDATE SET
        es_correcta = EXCLUDED.es_correcta,
        respuesta_usuario = EXCLUDED.respuesta_usuario,
        creado_en = CURRENT_TIMESTAMP
    `, [userId, pregunta_id, es_correcta, respuesta_usuario]);

    return NextResponse.json({
      success: true,
      message: 'Question logged successfully'
    });
  } catch (error) {
    console.error('Error logging user question:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
