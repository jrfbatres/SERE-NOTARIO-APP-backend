import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const { searchParams } = new URL(request.url);
    const examenId = searchParams.get('examen_id');

    if (!examenId) {
      return NextResponse.json({ success: false, error: 'Missing examen_id' }, { status: 400 });
    }

    const result = await query(`
      SELECT 
        p.id,
        p.texto_pregunta AS pregunta,
        p.explicacion,
        p.nivel,
        p.referencia_legal,
        p.articulo,
        p.ban_mostrar,
        p.ley_id,
        (SELECT l.nombre FROM "notarioElite".leyes l WHERE l.id = p.ley_id) as ley_nombre,
        (
          SELECT json_agg(
            json_build_object(
              'id', o.id,
              'texto_opcion', o.texto_opcion,
              'es_correcta', o.es_correcta
            ) ORDER BY o.orden
          )
          FROM "notarioElite".opciones o
          WHERE o.pregunta_id = p.id
        ) as opciones
      FROM "notarioElite".preguntas p
      WHERE p.examen_id = $1
      ORDER BY p.id ASC
    `, [examenId]);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
