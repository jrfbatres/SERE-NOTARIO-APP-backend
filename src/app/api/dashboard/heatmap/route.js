import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const text = `
      SELECT 
        l.id, 
        l.nombre, 
        l.porcentaje AS porcentaje_preguntas,
        (SELECT count(*) FROM "notarioElite".preguntas p WHERE p.ley_id = l.id) AS total_preguntas
      FROM "notarioElite".leyes l
      WHERE l.ban_estudiar = true
      ORDER BY l.porcentaje DESC
    `;
    const result = await query(text);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching heatmap:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
