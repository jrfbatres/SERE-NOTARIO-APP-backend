import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { nodo_id, nota, completado } = await request.json();

    if (nodo_id === 'simulacro') {
      // 1. Update overall last grade
      await query(`
        UPDATE "notarioElite".usuarios
        SET ultima_nota = $1
        WHERE id = $2::uuid
      `, [nota, userId]);

      // 2. Fetch grades per law based on answered questions in usuario_preguntas
      const lawGrades = await query(`
        SELECT 
          p.ley_id,
          (COUNT(CASE WHEN up.es_correcta THEN 1 END) * 10.0 / COUNT(up.pregunta_id)) as nota_ley
        FROM "notarioElite".usuario_preguntas up
        JOIN "notarioElite".preguntas p ON p.id = up.pregunta_id
        WHERE up.usuario_id = $1::uuid
        GROUP BY p.ley_id
      `, [userId]);

      // 3. Upsert into usuario_leyes for each law
      for (const row of lawGrades.rows) {
        await query(`
          INSERT INTO "notarioElite".usuario_leyes (usuario_id, ley_id, nota)
          VALUES ($1::uuid, $2, $3)
          ON CONFLICT (usuario_id, ley_id)
          DO UPDATE SET nota = EXCLUDED.nota
        `, [userId, row.ley_id, parseFloat(row.nota_ley)]);
      }

      return NextResponse.json({
        success: true,
        message: 'Mock exam score and law grades updated successfully'
      });
    }

    if (nodo_id && typeof nodo_id === 'string' && nodo_id.startsWith('ley-')) {
      const leyId = parseInt(nodo_id.split('-')[1]);
      
      await query(`
        INSERT INTO "notarioElite".usuario_leyes (usuario_id, ley_id, nota)
        VALUES ($1::uuid, $2, $3)
        ON CONFLICT (usuario_id, ley_id)
        DO UPDATE SET nota = EXCLUDED.nota
      `, [userId, leyId, nota]);

      return NextResponse.json({
        success: true,
        message: 'Law exam score updated successfully'
      });
    }

    // Find the ley_id associated with this node
    const nodeRes = await query(`
      SELECT ley_id FROM "notarioElite".nodos WHERE id = $1
    `, [nodo_id]);

    if (nodeRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Node not found' }, { status: 404 });
    }

    const leyId = nodeRes.rows[0].ley_id;

    // Update or insert the progress for the node
    await query(`
      INSERT INTO "notarioElite".usuario_nodos (usuario_id, nodo_id, ley_id, nota, completado, actualizado_en)
      VALUES ($1::uuid, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (usuario_id, nodo_id) 
      DO UPDATE SET 
        nota = EXCLUDED.nota, 
        completado = CASE WHEN "notarioElite".usuario_nodos.completado OR EXCLUDED.completado THEN TRUE ELSE FALSE END, 
        actualizado_en = CURRENT_TIMESTAMP
    `, [userId, nodo_id, leyId, nota, completado]);

    // Ensure the user has an entry in usuario_leyes
    await query(`
      INSERT INTO "notarioElite".usuario_leyes (usuario_id, ley_id, nota)
      VALUES ($1::uuid, $2, NULL)
      ON CONFLICT (usuario_id, ley_id) DO NOTHING
    `, [userId, leyId]);

    // Recalculate average score for this law
    await query(`
      UPDATE "notarioElite".usuario_leyes ul
      SET nota = (
        SELECT AVG(nota)
        FROM "notarioElite".usuario_nodos
        WHERE usuario_id = ul.usuario_id 
          AND ley_id = ul.ley_id 
          AND nota IS NOT NULL
      )
      WHERE ul.usuario_id = $1::uuid AND ul.ley_id = $2
    `, [userId, leyId]);

    return NextResponse.json({
      success: true,
      message: 'Progress and scores updated successfully'
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
