import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@72.61.9.7:1521/batres',
});

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta el ID del nodo' }, { status: 400 });
    }

    const query = `
      SELECT 
        e.titulo as examen_titulo,
        e.id as examen_id,
        p.id as pregunta_id,
        p.texto_pregunta as pregunta_texto
      FROM "notarioElite".preguntas p
      LEFT JOIN "notarioElite".examenes e ON p.examen_id = e.id
      WHERE p.nodo_id = $1
      ORDER BY e.titulo NULLS LAST, p.creado_en DESC
    `;

    const { rows } = await pool.query(query, [id]);

    // Group by examen
    const examenesMap = new Map();

    for (const row of rows) {
      const exTitle = row.examen_titulo || 'Preguntas Generales (Sin examen asignado)';
      
      if (!examenesMap.has(exTitle)) {
        examenesMap.set(exTitle, {
          examen_titulo: exTitle,
          cantidad: 0,
          preguntas: []
        });
      }
      
      const exGroup = examenesMap.get(exTitle);
      exGroup.cantidad += 1;
      exGroup.preguntas.push(row.pregunta_texto);
    }

    const groupedData = Array.from(examenesMap.values());

    return NextResponse.json({ success: true, data: groupedData });

  } catch (error) {
    console.error('Error fetching preguntas asociadas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
