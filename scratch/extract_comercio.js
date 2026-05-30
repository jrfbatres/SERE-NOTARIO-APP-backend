/**
 * extract_comercio.js
 * Extrae artículos del Código de Comercio de El Salvador desde PDF
 * y los importa a la BD bajo ley_id = 2
 * 
 * Uso: node scratch/extract_comercio.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PDF_PATH = 'C:\\Users\\jrfba\\OneDrive\\Desktop\\notario\\ley\\Comercio\\171117_072920482_archivo_documento_legislativo.pdf';
const LEY_ID = 2;

/**
 * Parse raw PDF text into article objects.
 * El Código de Comercio usa "Art. N.-" o "Artículo N." como delimitadores.
 */
function parseArticulos(rawText) {
  const articulos = [];

  // Normalize line endings
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split on article markers: "Art. 123.-" or "Artículo 123.-" or "Artículo 123."
  const artRegex = /\bArt(?:ículo|iculo|\.)\s+(\d+)\s*[.\-–]+/gi;

  const matches = [...text.matchAll(artRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const numero = match[1];
    const startIdx = match.index + match[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : text.length;

    let contenido = text.slice(startIdx, endIdx).trim();
    // Remove excessive whitespace/newlines
    contenido = contenido.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
    // Remove common page artifacts
    contenido = contenido.replace(/^\d+\s*\n/gm, '').trim();

    if (contenido.length < 5) continue;

    // Extract first line as potential title (up to 120 chars or first period)
    let titulo = '';
    const firstSentence = contenido.split(/[.\n]/)[0].trim();
    if (firstSentence.length < 120 && firstSentence.length > 5) {
      titulo = firstSentence;
    }

    articulos.push({ numero, titulo, contenido });
  }

  return articulos;
}

async function main() {
  console.log('📄 Cargando PDF...');

  let pdfParse;
  try {
    pdfParse = require('pdf-parse');
  } catch (e) {
    console.error('❌ pdf-parse no está instalado. Ejecuta: npm install pdf-parse --save-dev');
    process.exit(1);
  }

  const dataBuffer = fs.readFileSync(PDF_PATH);
  const pdfData = await pdfParse(dataBuffer);

  console.log(`✅ PDF cargado. Páginas: ${pdfData.numpages}, Texto: ${pdfData.text.length} chars`);

  // Save raw text for inspection
  fs.writeFileSync('scratch/comercio_raw.txt', pdfData.text, 'utf8');
  console.log('💾 Texto raw guardado en scratch/comercio_raw.txt');

  const articulos = parseArticulos(pdfData.text);
  console.log(`📋 Artículos detectados: ${articulos.length}`);

  if (articulos.length === 0) {
    console.error('❌ No se detectaron artículos. Revisa el formato del PDF en scratch/comercio_raw.txt');
    process.exit(1);
  }

  // Preview first 5
  console.log('\n--- Preview primeros 5 artículos ---');
  articulos.slice(0, 5).forEach(a => {
    console.log(`Art. ${a.numero}: ${a.titulo || '(sin título)'}`);
    console.log(`   ${a.contenido.slice(0, 100)}...`);
  });

  // Ask for confirmation before inserting
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  rl.question(`\n¿Insertar ${articulos.length} artículos en la BD para ley_id=${LEY_ID}? (s/n): `, async (answer) => {
    rl.close();
    
    if (answer.toLowerCase() !== 's') {
      console.log('❌ Cancelado.');
      return;
    }

    const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
    await client.connect();

    console.log('\n🔄 Insertando artículos...');
    let inserted = 0;
    let skipped = 0;

    for (const art of articulos) {
      try {
        await client.query(`
          INSERT INTO "notarioElite".articulos (ley_id, numero, tema, contenido)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [LEY_ID, art.numero, art.titulo || `Artículo ${art.numero}`, art.contenido]);
        inserted++;
      } catch (err) {
        console.warn(`⚠️  Skipped Art. ${art.numero}:`, err.message);
        skipped++;
      }
    }

    await client.end();
    console.log(`\n✅ Importación completada: ${inserted} insertados, ${skipped} omitidos.`);
    console.log('🔍 Revisa la BD para validar el contenido antes de crear los nodos.');
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
