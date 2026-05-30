const fs = require('fs');
const { Pool } = require('pg');

const DB_CONFIG = { connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' };
const GEMINI_API_KEY = "AIzaSyAtcdQSJsrtzScCw30qBqvHqDE1931dNVs";
const BATCH_SIZE = 15;

async function run() {
  const pool = new Pool(DB_CONFIG);
  
  try {
    // 1. Get all nodes for ley_id = 3
    const resNodos = await pool.query('SELECT id, nombre, nivel FROM "notarioElite".nodos WHERE ley_id = 3');
    const nodes = resNodos.rows;
    // We only want leaf nodes ideally, but let's provide all level 3 and 4 nodes as options.
    const candidateNodes = nodes.filter(n => n.nivel >= 3);
    const nodesPrompt = candidateNodes.map(n => `- ID: "${n.id}", Nombre: "${n.nombre}"`).join('\n');
    
    // 2. Read parsed articles
    const rawData = fs.readFileSync('scratch/familia_articulos.json', 'utf8');
    const articles = JSON.parse(rawData);
    
    console.log(`Processing ${articles.length} articles...`);
    
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      const batchPrompt = batch.map(a => `Art. ${a.numero}: ${a.contenido.substring(0, 300).replace(/\n/g, ' ')}`).join('\n\n');
      
      const prompt = `Eres un experto en derecho de familia de El Salvador. 
Asocia cada uno de los siguientes artículos al Nodo más adecuado de la lista dada, y además genera un 'tema' breve (Title Case, max 8 palabras) para el artículo.
      
NODOS DISPONIBLES:
${nodesPrompt}

ARTÍCULOS A PROCESAR:
${batchPrompt}

Responde ÚNICAMENTE con un objeto JSON donde cada llave es el número del artículo y el valor es un objeto con "nodo_id" (el ID exacto del nodo correspondiente de la lista) y "tema" (el tema generado).
Ejemplo:
{
  "1": { "nodo_id": "ley3_objeto_123", "tema": "Objeto y Ámbito de Aplicación" }
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
        } catch(e) {
          console.error(`Attempt ${attempts} failed:`, e.message);
          await new Promise(r => setTimeout(r, 3000));
        }
      }
      
      if (!success) {
        console.error(`Skipping batch starting with Art. ${batch[0].numero}`);
        continue;
      }
      
      // Insert into DB
      for (const a of batch) {
        const generated = results[a.numero];
        const nodo_id = generated?.nodo_id || null;
        const tema = generated?.tema || 'Sin Tema';
        
        try {
          await pool.query(
            'INSERT INTO "notarioElite".articulos (numero, tema, contenido, ley_id, nodo_id) VALUES ($1, $2, $3, $4, $5)',
            [a.numero, tema, a.contenido, 3, nodo_id]
          );
          console.log(`Inserted Art. ${a.numero} -> Nodo: ${nodo_id}, Tema: ${tema}`);
        } catch(e) {
          console.error(`Error inserting Art. ${a.numero}:`, e.message);
        }
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }
    
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
