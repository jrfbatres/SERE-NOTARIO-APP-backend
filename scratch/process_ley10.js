const fs = require('fs');
const pdf = require('pdf-parse');
const { Client } = require('pg');
const crypto = require('crypto');

const DB_CONFIG = { connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' };
const GEMINI_API_KEY = "AIzaSyAtcdQSJsrtzScCw30qBqvHqDE1931dNVs"; 
const LEY_ID = 10;
const PDF_PATH = 'C:\\Users\\jrfba\\OneDrive\\Desktop\\notario\\ley\\ley voluntaria\\ley voluntaria.pdf';

const LEY_JSON = {
  "ley": "Ley del Ejercicio Notarial de la Jurisdicción Voluntaria y de Otras Diligencias",
  "categorias": [
    {
      "nombre": "Disposiciones Fundamentales",
      "temas": [
        "Ámbito de aplicación y competencia",
        "Opción entre vía notarial o judicial",
        "Consentimiento unánime de interesados",
        "Remisión al juez por oposición o incapacidad",
        "Formación de expediente y protocolización",
        "Recepción de pruebas y auxilio judicial",
        "Publicación de edictos y avisos",
        "Audiencia al Procurador General de Pobres",
        "Prohibiciones de actuación a funcionarios"
      ]
    },
    {
      "nombre": "Diligencias de Jurisdicción Voluntaria",
      "temas": [
        "Ausencia de padres para matrimonio de menor",
        "Determinación del peculio profesional o industrial",
        "Rectificación de errores en partidas del Registro Civil",
        "Establecimiento subsidiario de estado civil o muerte",
        "Deslinde voluntario y mensura",
        "Remedición de inmuebles rústicos y urbanos",
        {
          "nombre": "Títulos Supletorios",
          "subtemas": [
            "Inmuebles generales (Art. 16)",
            "Predios urbanos de interés social (Art. 16-A)"
          ]
        },
        "Apertura y publicación de testamento cerrado",
        "Aceptación de herencia y declaratoria de herederos"
      ]
    },
    {
      "nombre": "Otras Diligencias Notariales",
      "temas": [
        "Comprobación de preñez, falta de ella o parto",
        "Notificación de revocación de poderes",
        "Traducciones de instrumentos extranjeros",
        "Pruebas previas para curador ad-litem de ausente",
        "Discernimiento de tutela o curaduría testamentaria",
        "Aposición y levantamiento de sellos",
        "Notificación de títulos ejecutivos a herederos",
        "Compulsa de procesos o instrumentos por exhorto",
        "Certificación de copias fidedignas (fotocopias)",
        "Identidad personal de vivos y fallecidos",
        "Calificación de edad por perito"
      ]
    },
    {
      "nombre": "Administración y Vigencia",
      "temas": [
        "Informes obligatorios a la Corte Suprema de Justicia",
        "Índice alfabético de causantes en la CSJ",
        "Aplicación a sucesiones posteriores a la ley",
        "Vigencia desde el 13 de abril de 1982"
      ]
    }
  ]
};

function normalizeText(text) {
  // Remove strange characters but keep spanish accents
  let cleaned = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9.,;:\-\s()"'%º]/g, '');
  // Fix newlines: if not preceded by . or ;, replace newline with space
  cleaned = cleaned.replace(/(?<![\.;])\s*\r?\n\s*/g, ' ');
  return cleaned.trim();
}

async function extractArticles() {
  const dataBuffer = fs.readFileSync(PDF_PATH);
  const data = await pdf(dataBuffer);
  let text = data.text;
  
  // Clean newlines with the rule
  text = text.replace(/(?<![\.;])\s*\r?\n\s*/g, ' ');

  // The articles start with "Art. N.-" or "Art. N-"
  const regex = /(Art\.\s*\d+[-A-Z]*\.-?)/gi;
  const parts = text.split(regex);
  
  const articles = [];
  let currentArtNum = '';
  
  for (let i = 1; i < parts.length; i += 2) {
    const artMatch = parts[i];
    let content = parts[i + 1] ? parts[i + 1].trim() : '';
    
    // Extract just the number
    const numMatch = artMatch.match(/\d+[-A-Z]*/);
    const numero = numMatch ? numMatch[0] : '';
    
    // Also remove the next article stuff if any leaked
    const nextArtIndex = content.search(/(Art\.\s*\d+[-A-Z]*\.-?)/i);
    if (nextArtIndex > -1) {
      content = content.substring(0, nextArtIndex).trim();
    }
    
    // Get tema from start of content if it's all caps, maybe?
    // Let's just pass empty tema for now and let the mapping handle it.
    
    articles.push({
      numero: numero,
      contenido: normalizeText(content)
    });
  }
  
  return articles;
}

async function insertNodes(client) {
  const insertedNodes = [];
  
  // Insert ROOT
  const rootId = crypto.randomUUID();
  let rootRes = await client.query(
    'INSERT INTO "notarioElite".nodos (id, ley_id, nombre, nivel, creado_en) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
    [rootId, LEY_ID, LEY_JSON.ley, 1]
  );
  
  let catOrder = 1;
  for (const cat of LEY_JSON.categorias) {
    const catId = crypto.randomUUID();
    let catRes = await client.query(
      'INSERT INTO "notarioElite".nodos (id, ley_id, nombre, nivel, padre_id, creado_en) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
      [catId, LEY_ID, cat.nombre, 2, rootId]
    );
    
    let temaOrder = 1;
    for (const tema of cat.temas) {
      if (typeof tema === 'string') {
        const tId = crypto.randomUUID();
        let temaRes = await client.query(
          'INSERT INTO "notarioElite".nodos (id, ley_id, nombre, nivel, padre_id, creado_en) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
          [tId, LEY_ID, tema, 3, catId]
        );
        insertedNodes.push({ id: tId, nombre: tema });
      } else {
        // Has subtemas
        const temaId = crypto.randomUUID();
        let temaRes = await client.query(
          'INSERT INTO "notarioElite".nodos (id, ley_id, nombre, nivel, padre_id, creado_en) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
          [temaId, LEY_ID, tema.nombre, 3, catId]
        );
        
        let subOrder = 1;
        for (const sub of tema.subtemas) {
          const sId = crypto.randomUUID();
          let subRes = await client.query(
            'INSERT INTO "notarioElite".nodos (id, ley_id, nombre, nivel, padre_id, creado_en) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
            [sId, LEY_ID, sub, 4, temaId]
          );
          insertedNodes.push({ id: sId, nombre: sub });
        }
      }
    }
  }
  return insertedNodes;
}

async function run() {
  console.log("--- INICIANDO PROCESO LEY 10 ---");
  const dbClient = new Client(DB_CONFIG);
  await dbClient.connect();

  try {
    // 1. Extraer articulos
    console.log("Extrayendo texto del PDF...");
    const articles = await extractArticles();
    console.log(`Se extrajeron ${articles.length} artículos.`);

    // 2. Limpiar Nodos y Artículos anteriores para esta ley (Idempotencia)
    await dbClient.query('DELETE FROM "notarioElite".articulos WHERE ley_id = $1', [LEY_ID]);
    await dbClient.query('DELETE FROM "notarioElite".nodos WHERE ley_id = $1', [LEY_ID]);
    await dbClient.query('DELETE FROM "notarioElite".glosario WHERE ley_id = $1', [LEY_ID]);

    // 3. Insertar Artículos
    const dbArticles = [];
    for (const art of articles) {
      if (!art.numero) continue;
      const res = await dbClient.query(
        'INSERT INTO "notarioElite".articulos (ley_id, numero, contenido, creado_en) VALUES ($1, $2, $3, NOW()) RETURNING id, numero, contenido',
        [LEY_ID, art.numero, art.contenido]
      );
      dbArticles.push(res.rows[0]);
    }
    console.log("Artículos insertados en la base de datos.");

    // 4. Insertar Nodos
    console.log("Creando jerarquía de nodos...");
    const leafNodes = await insertNodes(dbClient);
    console.log(`Se insertaron nodos. Total de nodos hoja: ${leafNodes.length}`);

    // 5. Mapeo Inteligente (Gemini)
    console.log("Iniciando mapeo inteligente con Gemini...");
    const prompt = `Eres un experto en derecho notarial salvadoreño. 
Tengo la Ley de Jurisdicción Voluntaria.
Aquí están los Nodos (Temas) de estudio:
${JSON.stringify(leafNodes, null, 2)}

Y aquí están los Artículos:
${JSON.stringify(dbArticles.map(a => ({ id: a.id, num: a.numero, text: a.contenido.substring(0, 150) })), null, 2)}

Tu tarea es mapear cada artículo al nodo (tema) que mejor le corresponda. 
Responde UNICAMENTE con un array JSON de objetos con la siguiente estructura:
[
  { "articulo_id": 123, "nodo_id": 456 }, ...
]
Asegúrate de mapear TODOS los artículos.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error("Gemini mapping failed");
    
    const data = await response.json();
    const mapping = JSON.parse(data.candidates[0].content.parts[0].text);

    // 6. Guardar Mapeo
    for (const map of mapping) {
      await dbClient.query(
        'UPDATE "notarioElite".articulos SET nodo_id = $1 WHERE id = $2',
        [map.nodo_id, map.articulo_id]
      );
    }
    console.log(`Se mapearon ${mapping.length} relaciones artículo-nodo.`);

    console.log("--- PROCESO LEY 10 COMPLETADO ---");
  } catch (err) {
    console.error(err);
  } finally {
    await dbClient.end();
  }
}

run();
