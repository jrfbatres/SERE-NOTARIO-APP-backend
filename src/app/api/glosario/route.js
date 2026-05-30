import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const leyId = searchParams.get('ley_id');

    if (leyId) {
      const parsedLeyId = parseInt(leyId);
      if (parsedLeyId === 1) {
        // For Código Civil (ley_id = 1), only return its own mapped glossary terms
        const text = `
          SELECT id, termino, definicion, ley_id
          FROM "notarioElite".glosario
          WHERE ley_id = 1
          ORDER BY LENGTH(termino) DESC
        `;
        const result = await query(text);
        return NextResponse.json({
          success: true,
          data: result.rows
        });
      } else {
        // For other laws, return terms that are mapped OR used in the articles of this law
        // Optimizing database usage by performing text search in Node.js instead of slow ILIKE query in Postgres.
        const allGlossaryQuery = `
          SELECT id, termino, definicion, ley_id
          FROM "notarioElite".glosario
        `;
        const glossaryResult = await query(allGlossaryQuery);
        const glossaryTerms = glossaryResult.rows;

        // Fetch all articles content for this law
        const articlesQuery = `
          SELECT a.contenido
          FROM "notarioElite".articulos a
          JOIN "notarioElite".nodos n ON a.nodo_id = n.id
          WHERE n.ley_id = $1
        `;
        const articlesResult = await query(articlesQuery, [parsedLeyId]);
        const articlesContent = articlesResult.rows.map(row => row.contenido || '').join(' ').toLowerCase();

        const filteredTerms = glossaryTerms.filter(g => {
          if (g.ley_id === parsedLeyId) return true;
          if (!g.termino) return false;
          return articlesContent.includes(g.termino.toLowerCase());
        });

        filteredTerms.sort((a, b) => b.termino.length - a.termino.length);

        return NextResponse.json({
          success: true,
          data: filteredTerms
        });
      }
    } else {
      // Return all glossary terms if no ley_id is specified
      const text = `
        SELECT id, termino, definicion, ley_id
        FROM "notarioElite".glosario
        ORDER BY LENGTH(termino) DESC
      `;
      const result = await query(text);
      return NextResponse.json({
        success: true,
        data: result.rows
      });
    }
  } catch (error) {
    console.error('Error fetching glossary:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

