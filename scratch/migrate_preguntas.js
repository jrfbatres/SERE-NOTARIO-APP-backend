const { Client } = require('pg');
const crypto = require('crypto');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Fetch questions from public.preguntas for ley_id 3 (codigo_id = 3)
    const resPreguntas = await client.query('SELECT * FROM public.preguntas WHERE codigo_id = 3');
    const preguntas = resPreguntas.rows;
    console.log(`Found ${preguntas.length} preguntas.`);

    let insertedQuestions = 0;
    let insertedOptions = 0;

    for (const p of preguntas) {
      // Try to find the matching nodo_id using the 'articulo' field
      let nodo_id = null;
      if (p.articulo) {
        // match exactly the number from the string e.g. "12" or "Art. 12" -> "12"
        const numMatch = String(p.articulo).match(/\d+/);
        if (numMatch) {
          const resArt = await client.query('SELECT nodo_id FROM "notarioElite".articulos WHERE numero = $1 AND ley_id = 3 LIMIT 1', [numMatch[0]]);
          if (resArt.rows.length > 0) {
            nodo_id = resArt.rows[0].nodo_id;
          }
        }
      }

      // Generate a new UUID or let DB handle it. Let's provide a UUID just in case it's UUID.
      // Or we can just let DB generate it and use RETURNING id.
      const insertPreguntaQuery = `
        INSERT INTO "notarioElite".preguntas 
        (id, ley_id, nodo_id, texto_pregunta, referencia_legal, articulo, explicacion, nivel, creado_en)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      const paramsPregunta = [
        crypto.randomUUID(),
        3, // ley_id
        nodo_id,
        p.texto_pregunta,
        p.referencia_legal,
        p.articulo,
        p.explicacion,
        p.nivel || 1,
        p.creado_en || new Date()
      ];

      const resInsertP = await client.query(insertPreguntaQuery, paramsPregunta);
      const newPreguntaId = resInsertP.rows[0].id;
      insertedQuestions++;

      // Fetch options for this old question
      const resOpciones = await client.query('SELECT * FROM public.opciones WHERE pregunta_id = $1', [p.id]);
      const opciones = resOpciones.rows;

      // Insert options with new pregunta_id
      for (const o of opciones) {
        const insertOpcionQuery = `
          INSERT INTO "notarioElite".opciones
          (id, pregunta_id, texto_opcion, es_correcta, orden)
          VALUES ($1, $2, $3, $4, $5)
        `;
        const paramsOpcion = [
          crypto.randomUUID(),
          newPreguntaId,
          o.texto_opcion,
          o.es_correcta,
          o.orden || 0
        ];
        await client.query(insertOpcionQuery, paramsOpcion);
        insertedOptions++;
      }
    }

    await client.query('COMMIT');
    console.log(`Migration successful! Inserted ${insertedQuestions} questions and ${insertedOptions} options into notarioElite schema.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', error);
  } finally {
    await client.end();
  }
}

run();
