const { Client } = require('pg');

const DB_CONFIG = { connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' };
const GEMINI_API_KEY = "AIzaSyAtcdQSJsrtzScCw30qBqvHqDE1931dNVs"; 
const LEY_ID = 10;

async function getLeafNodes(client) {
  // Obtenemos los nodos de la ley 10 que tengan artículos asignados o que no tengan hijos
  const res = await client.query(`
    SELECT n.id, n.nombre, 
           COALESCE(
             (SELECT string_agg('Art. ' || a.numero || ': ' || substring(a.contenido from 1 for 300), E'\n\n') 
              FROM "notarioElite".articulos a 
              WHERE a.nodo_id = n.id), 
             ''
           ) as articulos_texto
    FROM "notarioElite".nodos n
    WHERE n.ley_id = $1 AND n.nivel >= 3 AND (n.concepto IS NULL OR n.concepto = '')
  `, [LEY_ID]);
  return res.rows;
}

async function generateNodeContent(nodo) {
  const prompt = `Eres un jurisconsulto experto en derecho notarial y civil de El Salvador.
A continuación te presento un Tema de la "Ley de Jurisdicción Voluntaria" y los artículos asociados a él (si los hay).

Tema: ${nodo.nombre}
Artículos relacionados:
${nodo.articulos_texto || "No se ha proporcionado texto de artículos. Usa tu conocimiento sobre esta ley."}

Tu objetivo es generar un JSON válido con dos campos para la aplicación de estudio de notariado:
1. "concepto": Una explicación técnica pero clara de lo que trata este tema o procedimiento en la jurisdicción voluntaria (máximo 60 palabras).
2. "analisis_jurisconsulto": Un análisis profesional sobre la importancia práctica de este tema para el notario, posibles complicaciones, o la razón de ser de este trámite ante sede notarial en lugar de judicial (máximo 80 palabras).

Responde ÚNICAMENTE con un objeto JSON en este formato:
{
  "concepto": "...",
  "analisis_jurisconsulto": "..."
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
    throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
  return JSON.parse(text);
}

async function run() {
  console.log("--- INICIANDO GENERACIÓN DE CONCEPTOS Y ANÁLISIS PARA NODOS LEY 10 ---");
  const dbClient = new Client(DB_CONFIG);
  await dbClient.connect();

  try {
    const nodos = await getLeafNodes(dbClient);
    console.log(`Se encontraron ${nodos.length} nodos para procesar.`);

    for (let i = 0; i < nodos.length; i++) {
      const nodo = nodos[i];
      console.log(`\n[${i + 1}/${nodos.length}] Procesando nodo: ${nodo.nombre}`);
      
      try {
        const generated = await generateNodeContent(nodo);
        
        await dbClient.query(`
          UPDATE "notarioElite".nodos 
          SET concepto = $1, analisis_jurisconsulto = $2
          WHERE id = $3
        `, [generated.concepto, generated.analisis_jurisconsulto, nodo.id]);
        
        console.log(`  -> Actualizado correctamente.`);
      } catch (err) {
        console.error(`  -> Error al procesar nodo: ${err.message}`);
      }
      
      // Pequeña pausa para no saturar la API
      await new Promise(r => setTimeout(r, 1500));
    }

    console.log("\n--- GENERACIÓN DE CONCEPTOS COMPLETADA ---");

  } catch (err) {
    console.error("Error global:", err);
  } finally {
    await dbClient.end();
  }
}

run();
