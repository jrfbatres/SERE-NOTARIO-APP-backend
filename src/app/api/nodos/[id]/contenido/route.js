import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    // Next.js 15 App Router standard for dynamic params: wait for params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing node ID' }, { status: 400 });
    }

    // Fetch node details including AI insights
    const nodeQuery = `
      SELECT id, nombre, concepto, analisis_jurisconsulto, tips_didacticos, total_preguntas, porcentaje_preguntas
      FROM "notarioElite".nodos
      WHERE id = $1
    `;
    const nodeResult = await query(nodeQuery, [id]);

    if (nodeResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Node not found' }, { status: 404 });
    }

    const node = nodeResult.rows[0];

    // Fetch articles associated with this node and its descendants recursively
    const articlesQuery = `
      WITH RECURSIVE subnodes AS (
          SELECT id FROM "notarioElite".nodos WHERE id = $1
          UNION ALL
          SELECT n.id FROM "notarioElite".nodos n JOIN subnodes s ON n.padre_id = s.id
      )
      SELECT id, numero, tema AS titulo, contenido
      FROM "notarioElite".articulos
      WHERE nodo_id IN (SELECT id FROM subnodes)
      ORDER BY numero::integer ASC
    `;
    const articlesResult = await query(articlesQuery, [id]);

    let articulos = articlesResult.rows;

    // Fallback: if no articles, fetch distinct articles linked via this node's and descendants' questions
    if (articulos.length === 0) {
      const fallbackQuery = `
        WITH RECURSIVE subnodes AS (
            SELECT id FROM "notarioElite".nodos WHERE id = $1
            UNION ALL
            SELECT n.id FROM "notarioElite".nodos n JOIN subnodes s ON n.padre_id = s.id
        )
        SELECT a.id, a.numero, a.tema AS titulo, a.contenido
        FROM "notarioElite".articulos a
        JOIN "notarioElite".pregunta_articulos pa ON a.id = pa.articulo_id
        JOIN "notarioElite".preguntas p ON p.id = pa.pregunta_id
        WHERE p.nodo_id IN (SELECT id FROM subnodes)
        GROUP BY a.id, a.numero, a.tema, a.contenido
        ORDER BY a.numero::integer ASC
      `;
      const fallbackResult = await query(fallbackQuery, [id]);
      articulos = fallbackResult.rows;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...node,
        articulos,
        articulos_via_preguntas: articlesResult.rows.length === 0 && articulos.length > 0
      }
    });
  } catch (error) {
    console.error('Error fetching node content:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
