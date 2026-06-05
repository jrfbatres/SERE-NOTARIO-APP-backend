import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodoId = searchParams.get('nodo_id');

    if (!nodoId) {
      return NextResponse.json({ success: false, error: 'Missing nodo_id parameter' }, { status: 400 });
    }

    let rawRows = [];

    if (nodoId === 'simulacro') {
      // 1. Determine difficulty levels dynamically by cascading downwards if questions are scarce
      let levels = ['dificil', 'trampa'];
      
      const countHard = await query(`
        SELECT COUNT(*) as count 
        FROM "notarioElite".preguntas 
        WHERE nivel IN ('dificil', 'trampa') AND ban_mostrar = 'S'
      `);
      
      if (parseInt(countHard.rows[0].count) < 30) {
        const countMed = await query(`
          SELECT COUNT(*) as count 
          FROM "notarioElite".preguntas 
          WHERE nivel IN ('intermedio', 'dificil', 'trampa') AND ban_mostrar = 'S'
        `);
        
        if (parseInt(countMed.rows[0].count) >= 30) {
          levels = ['intermedio', 'dificil', 'trampa'];
        } else {
          levels = ['facil', 'intermedio', 'dificil', 'trampa'];
        }
      }

      // Fetch laws that have questions within the selected levels
      const lawsResult = await query(`
        SELECT l.id, l.nombre, l.porcentaje, COUNT(p.id) as total_preguntas
        FROM "notarioElite".leyes l
        JOIN "notarioElite".preguntas p ON p.ley_id = l.id
        WHERE p.nivel = ANY($1) AND p.ban_mostrar = 'S'
        GROUP BY l.id, l.nombre, l.porcentaje
        HAVING COUNT(p.id) > 0
      `, [levels]);

      const candidateLaws = lawsResult.rows;

      if (candidateLaws.length === 0) {
        return NextResponse.json({ success: false, error: 'No questions found for simulacro' }, { status: 404 });
      }

      // 2. Proportional allocation of 30 questions
      const totalWeight = candidateLaws.reduce((sum, law) => sum + parseFloat(law.porcentaje || 0), 0);
      
      let allocatedSum = 0;
      const lawsWithAllocation = candidateLaws.map(law => {
        const rawTarget = totalWeight > 0 ? (parseFloat(law.porcentaje || 0) / totalWeight) * 30 : 30 / candidateLaws.length;
        const floorAlloc = Math.floor(rawTarget);
        allocatedSum += floorAlloc;
        return {
          ...law,
          allocated_count: floorAlloc,
          remainder: rawTarget - floorAlloc
        };
      });

      // Distribute remainder using Largest Remainder Method
      let diff = 30 - allocatedSum;
      if (diff > 0) {
        lawsWithAllocation.sort((a, b) => b.remainder - a.remainder);
        for (let i = 0; i < diff && i < lawsWithAllocation.length; i++) {
          lawsWithAllocation[i].allocated_count += 1;
        }
      }

      // Clamp allocations to database capacities and redistribute deficits
      let finalAllocations = [];
      let totalAllocated = 0;

      lawsWithAllocation.forEach(law => {
        const limit = parseInt(law.total_preguntas);
        let count = Math.min(law.allocated_count, limit);
        totalAllocated += count;
        finalAllocations.push({
          ...law,
          allocated_count: count,
          spare: limit - count
        });
      });

      let deficit = 30 - totalAllocated;
      if (deficit > 0) {
        finalAllocations.sort((a, b) => b.spare - a.spare);
        for (let i = 0; i < finalAllocations.length && deficit > 0; i++) {
          const extra = Math.min(deficit, finalAllocations[i].spare);
          finalAllocations[i].allocated_count += extra;
          finalAllocations[i].spare -= extra;
          deficit -= extra;
        }
      }

      // 3. Fetch random questions for each law based on allocation
      const queryPromises = finalAllocations
        .filter(law => law.allocated_count > 0)
        .map(law => {
          return query(`
            SELECT 
              p.id,
              p.texto_pregunta AS pregunta,
              p.explicacion,
              p.nivel,
              p.referencia_legal,
              p.articulo,
              p.ley_id,
              p.orden,
              (SELECT e.titulo FROM "notarioElite".examenes e WHERE e.id = p.examen_id) as examen_titulo,
              (SELECT e.pdf_url FROM "notarioElite".examenes e WHERE e.id = p.examen_id) as pdf_url,
              $2 as ley_nombre,
              (
                SELECT json_agg(
                  json_build_object(
                    'texto_opcion', o.texto_opcion,
                    'es_correcta', o.es_correcta
                  ) ORDER BY o.orden
                )
                FROM "notarioElite".opciones o
                WHERE o.pregunta_id = p.id
              ) as opciones,
              json_agg(
                json_build_object(
                  'id', a.id,
                  'numero', a.numero,
                  'titulo', a.tema,
                  'contenido', a.contenido
                )
              ) FILTER (WHERE a.id IS NOT NULL) as articulos_vinculados
            FROM "notarioElite".preguntas p
            LEFT JOIN "notarioElite".pregunta_articulos pa ON p.id = pa.pregunta_id
            LEFT JOIN "notarioElite".articulos a ON pa.articulo_id = a.id
            WHERE p.ley_id = $1 AND p.nivel = ANY($3) AND p.ban_mostrar = 'S'
            GROUP BY p.id
            ORDER BY RANDOM()
            LIMIT $4
          `, [law.id, law.nombre, levels, law.allocated_count]);
        });

      const queryResults = await Promise.all(queryPromises);
      rawRows = queryResults.flatMap(r => r.rows);

      // Shuffle final questions list so laws are mixed together
      rawRows.sort(() => Math.random() - 0.5);

    } else if (nodoId && typeof nodoId === 'string' && nodoId.startsWith('ley-')) {
      const leyId = parseInt(nodoId.split('-')[1]);
      const result = await query(`
        SELECT 
          p.id,
          p.texto_pregunta AS pregunta,
          p.explicacion,
          p.nivel,
          p.referencia_legal,
          p.articulo,
          p.ley_id,
          p.orden,
          (SELECT e.titulo FROM "notarioElite".examenes e WHERE e.id = p.examen_id) as examen_titulo,
          (SELECT e.pdf_url FROM "notarioElite".examenes e WHERE e.id = p.examen_id) as pdf_url,
          (SELECT l.nombre FROM "notarioElite".leyes l WHERE l.id = p.ley_id) as ley_nombre,
          (
            SELECT json_agg(
              json_build_object(
                'texto_opcion', o.texto_opcion,
                'es_correcta', o.es_correcta
              ) ORDER BY o.orden
            )
            FROM "notarioElite".opciones o
            WHERE o.pregunta_id = p.id
          ) as opciones,
          json_agg(
            json_build_object(
              'id', a.id,
              'numero', a.numero,
              'titulo', a.tema,
              'contenido', a.contenido
            )
          ) FILTER (WHERE a.id IS NOT NULL) as articulos_vinculados
        FROM "notarioElite".preguntas p
        LEFT JOIN "notarioElite".pregunta_articulos pa ON p.id = pa.pregunta_id
        LEFT JOIN "notarioElite".articulos a ON pa.articulo_id = a.id
        WHERE p.ley_id = $1 AND p.ban_mostrar = 'S'
        GROUP BY p.id
        ORDER BY RANDOM()
        LIMIT 20
      `, [leyId]);

      rawRows = result.rows;
    } else {
      // Fetch 5 random questions for a specific node
      const result = await query(`
        SELECT 
          p.id,
          p.texto_pregunta AS pregunta,
          p.explicacion,
          p.nivel,
          p.referencia_legal,
          p.articulo,
          p.ley_id,
          p.orden,
          (SELECT e.titulo FROM "notarioElite".examenes e WHERE e.id = p.examen_id) as examen_titulo,
          (SELECT e.pdf_url FROM "notarioElite".examenes e WHERE e.id = p.examen_id) as pdf_url,
          (SELECT l.nombre FROM "notarioElite".leyes l WHERE l.id = p.ley_id) as ley_nombre,
          (
            SELECT json_agg(
              json_build_object(
                'texto_opcion', o.texto_opcion,
                'es_correcta', o.es_correcta
              ) ORDER BY o.orden
            )
            FROM "notarioElite".opciones o
            WHERE o.pregunta_id = p.id
          ) as opciones,
          json_agg(
            json_build_object(
              'id', a.id,
              'numero', a.numero,
              'titulo', a.tema,
              'contenido', a.contenido
            )
          ) FILTER (WHERE a.id IS NOT NULL) as articulos_vinculados
        FROM "notarioElite".preguntas p
        LEFT JOIN "notarioElite".pregunta_articulos pa ON p.id = pa.pregunta_id
        LEFT JOIN "notarioElite".articulos a ON pa.articulo_id = a.id
        WHERE p.ban_mostrar = 'S' AND p.nodo_id IN (
          WITH RECURSIVE subnodes AS (
              SELECT id FROM "notarioElite".nodos WHERE id = $1
              UNION ALL
              SELECT n.id FROM "notarioElite".nodos n JOIN subnodes s ON n.padre_id = s.id
          )
          SELECT id FROM subnodes
        )
        GROUP BY p.id
        ORDER BY RANDOM()
        LIMIT 40
      `, [nodoId]);

      rawRows = result.rows;
    }

    // Map rows to the structure expected by the frontend
    const mappedQuestions = rawRows.map(q => {
      let optionsArr = q.opciones || [];

      // Deduplicate options while prioritizing the correct one
      const uniqueOptions = [];
      const seenTexts = new Set();
      
      const correctOpts = optionsArr.filter(o => o.es_correcta);
      const incorrectOpts = optionsArr.filter(o => !o.es_correcta);

      const normalize = (text) => text.replace(/^[a-z]\)\s*/i, '').replace(/[^a-z0-9áéíóúüñ]/gi, '').toLowerCase();

      correctOpts.forEach(opt => {
        const norm = normalize(opt.texto_opcion);
        if (norm && !seenTexts.has(norm)) {
          seenTexts.add(norm);
          uniqueOptions.push(opt);
        }
      });

      incorrectOpts.forEach(opt => {
        const norm = normalize(opt.texto_opcion);
        if (norm && !seenTexts.has(norm)) {
          seenTexts.add(norm);
          uniqueOptions.push(opt);
        }
      });

      // To maintain the original order, sort uniqueOptions by their original index
      uniqueOptions.sort((a, b) => optionsArr.indexOf(a) - optionsArr.indexOf(b));

      let opcion_a = '';
      let opcion_b = '';
      let opcion_c = '';
      let opcion_d = '';
      let opcion_e = '';
      let respuesta_correcta = 'A';

      uniqueOptions.forEach((opt, idx) => {
        // Strip out leading "a) ", "b) ", "c) " if present for clean display
        const cleanText = opt.texto_opcion.replace(/^[a-z]\)\s*/i, '');
        if (idx === 0) {
          opcion_a = cleanText;
          if (opt.es_correcta) respuesta_correcta = 'A';
        } else if (idx === 1) {
          opcion_b = cleanText;
          if (opt.es_correcta) respuesta_correcta = 'B';
        } else if (idx === 2) {
          opcion_c = cleanText;
          if (opt.es_correcta) respuesta_correcta = 'C';
        } else if (idx === 3) {
          opcion_d = cleanText;
          if (opt.es_correcta) respuesta_correcta = 'D';
        } else if (idx === 4) {
          opcion_e = cleanText;
          if (opt.es_correcta) respuesta_correcta = 'E';
        }
      });

      return {
        id: q.id,
        pregunta: q.pregunta,
        explicacion: q.explicacion,
        nivel_dificultad: q.nivel === 'trampa' ? 'Trampa' : q.nivel === 'dificil' ? 'Difícil' : q.nivel === 'intermedio' ? 'Intermedio' : 'Fácil',
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        opcion_e,
        respuesta_correcta,
        referencia_legal: q.referencia_legal,
        articulo: q.articulo,
        ley_id: q.ley_id,
        ley_nombre: q.ley_nombre,
        examen_titulo: q.examen_titulo,
        pdf_url: q.pdf_url,
        orden: q.orden,
        articulos_vinculados: q.articulos_vinculados || []
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedQuestions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
