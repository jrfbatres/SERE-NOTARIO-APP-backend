import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { awardInvitations } from '@/lib/invitaciones';

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

    let invitationsAwarded = 0;
    // Lógica de invitaciones
    if (completado && (leyId === 1 || leyId === 9)) {
      // Regla 5: Primer nodo completo
      const r5 = await awardInvitations(userId, 2, `primer_nodo_ley_${leyId}`);
      if (r5) invitationsAwarded += 2;

      // Regla 6: Nodo padre completo
      try {
        const ancestorsRes = await query(`
          WITH RECURSIVE Ancestors AS (
            SELECT padre_id, id FROM "notarioElite".nodos WHERE id = $1
            UNION ALL
            SELECT n.padre_id, n.id FROM "notarioElite".nodos n
            INNER JOIN Ancestors a ON n.id = a.padre_id
          )
          SELECT id FROM Ancestors WHERE id != $1
        `, [nodo_id]);

        const ancestors = ancestorsRes.rows.map(r => r.id);

        for (const pId of ancestors) {
          if (!pId) continue;
          const leavesRes = await query(`
            WITH RECURSIVE Leaves AS (
              SELECT id, padre_id, total_preguntas FROM "notarioElite".nodos WHERE id = $1
              UNION ALL
              SELECT n.id, n.padre_id, n.total_preguntas FROM "notarioElite".nodos n
              INNER JOIN Leaves l ON n.padre_id = l.id
            )
            SELECT id FROM Leaves WHERE total_preguntas > 0
          `, [pId]);
          
          const leaves = leavesRes.rows.map(r => r.id);
          
          if (leaves.length > 0) {
            const completedRes = await query(`
              SELECT COUNT(*) as count FROM "notarioElite".usuario_nodos
              WHERE usuario_id = $1 AND nodo_id = ANY($2) AND completado = TRUE
            `, [userId, leaves]);
            
            if (parseInt(completedRes.rows[0].count, 10) === leaves.length) {
              const r6 = await awardInvitations(userId, 2, `nodo_padre_${pId}`);
              if (r6) invitationsAwarded += 2;
            }
          }
        }
      } catch (e) {
        console.error('Error calculando nodos padres:', e);
      }
    }

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
      message: 'Progress and scores updated successfully',
      invitationsAwarded
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
