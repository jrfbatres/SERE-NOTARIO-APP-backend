const { Client } = require('pg');

const DB_CONFIG = { connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' };
const GEMINI_API_KEY = "AIzaSyAtcdQSJsrtzScCw30qBqvHqDE1931dNVs"; 
const LEY_ID = 10; 
const BATCH_SIZE = 40; 

async function getArticles(client) {
  const res = await client.query(`
    SELECT numero, tema, contenido 
    FROM "notarioElite".articulos 
    WHERE ley_id = $1 
    ORDER BY NULLIF(regexp_replace(numero, '\\D', '', 'g'), '')::int ASC
  `, [LEY_ID]);
  return res.rows;
}

async function insertGlossaryTerms(client, terms) {
  for (const term of terms) {
    // Verificar si el término ya existe para esta ley
    const check = await client.query(
      'SELECT id FROM "notarioElite".glosario WHERE ley_id = $1 AND lower(termino) = lower($2)',
      [LEY_ID, term.termino.trim()]
    );
    
    if (check.rows.length === 0) {
      await client.query(
        'INSERT INTO "notarioElite".glosario (ley_id, termino, definicion, explicacion_adicional, creado_en) VALUES ($1, $2, $3, $4, NOW())',
        [LEY_ID, term.termino.trim(), term.definicion.trim(), term.explicacion.trim()]
      );
      console.log(`+ Término insertado: ${term.termino}`);
    } else {
      console.log(`- Término duplicado omitido: ${term.termino}`);
    }
  }
}

async function processBatch(batch) {
  const artsContext = batch.map(a => `Art. ${a.numero} (${a.tema}): ${a.contenido.substring(0, 300)}`).join('\n\n');
  
  const prompt = `Eres un jurisconsulto experto en derecho de familia de El Salvador. 
A continuación te proporciono un conjunto de artículos del Código de Familia.
Tu objetivo es extraer exactamente 5 conceptos o términos jurídicos clave, relevantes e importantes que se mencionan o definen en estos artículos, que un estudiante de derecho debe conocer para el examen de notariado.

ARTÍCULOS:
${artsContext}

Responde ÚNICAMENTE con un arreglo (array) en formato JSON válido. Cada objeto del arreglo debe tener exactamente esta estructura:
[
  {
    "termino": "Nombre del término o concepto jurídico (ej. Matrimonio, Tutela, Parentesco)",
    "definicion": "Definición legal concisa basada en la ley (máximo 40 palabras).",
    "explicacion": "Explicación adicional, importancia práctica o interpretación (máximo 60 palabras)."
  },
  ...
]`;

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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';
  return JSON.parse(text);
}

async function run() {
  console.log("--- INICIANDO GENERACIÓN DE GLOSARIO PARA LEY 3 (CÓDIGO DE FAMILIA) ---");
  const dbClient = new Client(DB_CONFIG);
  await dbClient.connect();

  try {
    const articulos = await getArticles(dbClient);
    console.log(`Total de artículos obtenidos: ${articulos.length}`);

    for (let i = 0; i < articulos.length; i += BATCH_SIZE) {
      const batch = articulos.slice(i, i + BATCH_SIZE);
      console.log(`\nProcesando lote ${i / BATCH_SIZE + 1} de ${Math.ceil(articulos.length / BATCH_SIZE)} (Artículos ${batch[0].numero} al ${batch[batch.length - 1].numero})...`);
      
      try {
        const terms = await processBatch(batch);
        console.log(`Gemini extrajo ${terms.length} términos.`);
        await insertGlossaryTerms(dbClient, terms);
      } catch (err) {
        console.error(`Error en el lote ${i / BATCH_SIZE + 1}:`, err.message);
      }
      
      // Pequeña pausa para evitar rate limits
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log("\n--- GENERACIÓN DE GLOSARIO COMPLETADA ---");

  } catch (err) {
    console.error("Error global:", err);
  } finally {
    await dbClient.end();
  }
}

run();
