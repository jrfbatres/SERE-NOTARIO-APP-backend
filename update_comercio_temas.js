const { Client } = require('pg');

const DB_CONFIG = { connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' };
const GEMINI_API_KEY = "AIzaSyAtcdQSJsrtzScCw30qBqvHqDE1931dNVs";
const LEY_ID = 2; // Código de Comercio
const BATCH_SIZE = 40;

async function getAllArticles() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  try {
    // Fetch all articles for Ley 2
    const res = await client.query(
      `SELECT id, numero, tema, contenido FROM "notarioElite".articulos 
       WHERE ley_id = $1 
       ORDER BY numero::integer ASC`,
      [LEY_ID]
    );
    return res.rows;
  } finally {
    await client.end().catch(() => {});
  }
}

async function updateArticleTema(client, id, tema) {
  await client.query(
    'UPDATE "notarioElite".articulos SET tema = $1 WHERE id = $2',
    [tema, id]
  );
}

async function processBatch(batch) {
  const textosParaIA = batch.map(a =>
    `Art. ${a.numero}:\n${(a.contenido || '').substring(0, 600)}`
  ).join('\n\n');

  const prompt = `Eres un jurisconsulto experto en derecho mercantil de El Salvador.
Para cada artículo del Código de Comercio de El Salvador que aparece abajo, genera un "tema" conciso (máximo 8 palabras) que describa de qué trata el artículo.
El tema debe estar en español, usar mayúsculas y minúsculas correctamente (Title Case), sin punto final, y ser suficientemente descriptivo para identificar el artículo de un vistazo.

Si el artículo es derogada (contiene texto como "DEROGADO", o está en blanco/vacío), usa: "Artículo Derogado" o "Derogación del Artículo [número]".

Ejemplos correctos:
- Art. 1 -> "Ámbito de Aplicación y Jerarquía Normativa"
- Art. 2 -> "Clasificación y Definición de Comerciantes"
- Art. 7 -> "Capacidad Legal para el Comercio"
- Art. 22 -> "Requisitos de la Escritura Social"
- Art. 127 -> "Responsabilidad Limitada del Accionista"
- Art. 570 -> "Artículo Derogado"

ARTÍCULOS A PROCESAR:
${textosParaIA}

Responde ÚNICAMENTE con un objeto JSON donde cada llave es el número exacto del artículo (por ejemplo "1", "22", "570") y el valor es el tema descriptivo generado:
{
  "1": "Tema del artículo 1",
  "22": "Tema del artículo 22"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
  return JSON.parse(text);
}

async function run() {
  console.log("--- ACTUALIZANDO TEMAS DEL CÓDIGO DE COMERCIO (LEY_ID = 2) ---");
  const articles = await getAllArticles();
  const total = articles.length;
  console.log(`Total de artículos a procesar: ${total}`);

  const dbClient = new Client(DB_CONFIG);
  await dbClient.connect();

  try {
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      console.log(`\nProcesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(total / BATCH_SIZE)} (Art. ${batch[0].numero} - ${batch[batch.length - 1].numero})...`);

      let results = {};
      let attempts = 0;
      let success = false;

      while (!success && attempts < 3) {
        attempts++;
        try {
          results = await processBatch(batch);
          success = true;
        } catch (err) {
          console.error(`❌ Error en intento ${attempts} con Gemini:`, err.message);
          if (attempts < 3) {
            console.log("Esperando 5 segundos antes de reintentar...");
            await new Promise(r => setTimeout(r, 5000));
          }
        }
      }

      if (!success) {
        console.error("❌ Fallaron todos los intentos con Gemini para este lote. Saltando...");
        continue;
      }

      // Actualizar la base de datos para este lote
      for (const art of batch) {
        const generatedTema = results[art.numero] || results[String(art.numero)];
        if (generatedTema) {
          try {
            await updateArticleTema(dbClient, art.id, generatedTema);
            console.log(`✅ Art. ${art.numero} -> "${generatedTema}"`);
          } catch (dbErr) {
            console.error(`❌ Error actualizando Art. ${art.numero} en la DB:`, dbErr.message);
          }
        } else {
          console.warn(`⚠️ No se generó tema para el Art. ${art.numero}`);
        }
      }

      // Esperar 2 segundos entre lotes para respetar límites de cuota
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log("\n🎉 ¡Actualización de temas del Código de Comercio completada!");
  } catch (err) {
    console.error("❌ Error general durante la ejecución:", err);
  } finally {
    await dbClient.end().catch(() => {});
  }
}

run();
