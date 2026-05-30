const { Client } = require('pg');
const GEMINI_API_KEY = "AIzaSyAtcdQSJsrtzScCw30qBqvHqDE1931dNVs";

async function run() {
  const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await client.connect();

  try {
    // 1. Get all nodes to use as options (we'll prefer leaf nodes but provide all for context)
    const resNodes = await client.query('SELECT id, nombre, nivel FROM "notarioElite".nodos WHERE ley_id = 3 AND nivel >= 2 ORDER BY nivel DESC');
    const nodesPrompt = resNodes.rows.map(n => `- ID: "${n.id}", Nombre: "${n.nombre}" (Nivel ${n.nivel})`).join('\n');

    // 2. Get questions without nodo_id
    const resUnmapped = await client.query('SELECT id, texto_pregunta, explicacion FROM "notarioElite".preguntas WHERE ley_id = 3 AND nodo_id IS NULL');
    const questions = resUnmapped.rows;
    console.log(`Encontradas ${questions.length} preguntas sin nodo_id.`);

    const BATCH_SIZE = 10;
    let updatedCount = 0;

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const batchPrompt = batch.map(q => `PREGUNTA ID: "${q.id}"\nTEXTO: "${q.texto_pregunta}"\nEXPLICACION: "${q.explicacion || ''}"`).join('\n\n');

      const prompt = `Eres un experto en derecho de familia de El Salvador. 
Asocia cada una de las siguientes preguntas de examen de notariado al Nodo más adecuado de la lista dada. Debes elegir preferiblemente "nodos hijos" (los de mayor nivel como Nivel 3 o 4) que describan exactamente el tema de la pregunta.

NODOS DISPONIBLES:
${nodesPrompt}

PREGUNTAS A PROCESAR:
${batchPrompt}

Responde ÚNICAMENTE con un objeto JSON donde cada llave es el ID exacto de la pregunta, y el valor es un objeto con la propiedad "nodo_id".
Ejemplo:
{
  "uuid-de-la-pregunta-1": { "nodo_id": "ley3_cuidado_personal_2489" },
  "uuid-de-la-pregunta-2": { "nodo_id": "ley3_impedimentos_7305" }
}`;

      let success = false;
      let attempts = 0;
      let results = {};

      while (!success && attempts < 3) {
        attempts++;
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
          results = JSON.parse(text);
          success = true;
        } catch (e) {
          console.error(`Lote ${i / BATCH_SIZE + 1}, Intento ${attempts} falló:`, e.message);
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      if (!success) {
        console.error(`Saltando lote ${i / BATCH_SIZE + 1} por errores continuos.`);
        continue;
      }

      // Update in DB
      for (const q of batch) {
        const nodo_id = results[q.id]?.nodo_id;
        if (nodo_id) {
          try {
            await client.query('UPDATE "notarioElite".preguntas SET nodo_id = $1 WHERE id = $2', [nodo_id, q.id]);
            updatedCount++;
            console.log(`✅ Pregunta ${q.id} -> Nodo: ${nodo_id}`);
          } catch (e) {
            console.error(`Error actualizando pregunta ${q.id}:`, e.message);
          }
        } else {
          console.log(`⚠️ IA no retornó nodo para pregunta ${q.id}`);
        }
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`Proceso terminado. Se actualizaron ${updatedCount} preguntas.`);

  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await client.end();
  }
}

run();
