/**
 * extract_comercio_preview.js
 * Solo extrae y muestra preview - NO inserta en BD
 */

const fs = require('fs');

const PDF_PATH = 'C:\\Users\\jrfba\\OneDrive\\Desktop\\notario\\ley\\Comercio\\171117_072920482_archivo_documento_legislativo.pdf';

function parseArticulos(rawText) {
  const articulos = [];
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Multiple patterns for Salvadoran law format
  const artRegex = /\bArt(?:ículo|iculo|\.)\s+(\d+)\s*[.\-–]+/gi;
  const matches = [...text.matchAll(artRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const numero = match[1];
    const startIdx = match.index + match[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : text.length;

    let contenido = text.slice(startIdx, endIdx).trim();
    contenido = contenido.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();

    if (contenido.length < 5) continue;

    let titulo = '';
    const firstLine = contenido.split('\n')[0].trim();
    if (firstLine.length < 150 && firstLine.length > 5) {
      titulo = firstLine;
    }

    articulos.push({ numero: parseInt(numero), titulo, contenido });
  }

  // Sort by article number
  articulos.sort((a, b) => a.numero - b.numero);

  return articulos;
}

async function main() {
  console.log('📄 Cargando PDF...');
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse();
  const dataBuffer = fs.readFileSync(PDF_PATH);
  const pdfData = await parser.parse(dataBuffer);

  console.log(`✅ Páginas: ${pdfData.numpages}, Texto: ${pdfData.text.length} chars`);

  // Save raw text
  fs.writeFileSync('scratch/comercio_raw.txt', pdfData.text, 'utf8');
  console.log('💾 Texto raw guardado en scratch/comercio_raw.txt');

  const articulos = parseArticulos(pdfData.text);
  console.log(`\n📋 Total artículos detectados: ${articulos.length}`);

  // Show first and last 5
  console.log('\n--- Primeros 5 ---');
  articulos.slice(0, 5).forEach(a => {
    console.log(`Art. ${a.numero}: "${a.titulo.slice(0, 80)}"`);
    console.log(`   ${a.contenido.slice(0, 120).replace(/\n/g, ' ')}...\n`);
  });

  console.log('--- Últimos 5 ---');
  articulos.slice(-5).forEach(a => {
    console.log(`Art. ${a.numero}: "${a.titulo.slice(0, 80)}"`);
    console.log(`   ${a.contenido.slice(0, 120).replace(/\n/g, ' ')}...\n`);
  });

  // Check for gaps
  const nums = articulos.map(a => a.numero);
  const max = Math.max(...nums);
  const missing = [];
  for (let i = 1; i <= max; i++) {
    if (!nums.includes(i)) missing.push(i);
  }
  if (missing.length > 0) {
    console.log(`\n⚠️  Artículos faltantes (${missing.length}): ${missing.slice(0, 30).join(', ')}${missing.length > 30 ? '...' : ''}`);
  } else {
    console.log(`\n✅ No hay gaps - secuencia completa del 1 al ${max}`);
  }

  // Save parsed JSON for review
  fs.writeFileSync('scratch/comercio_parsed.json', JSON.stringify(articulos, null, 2), 'utf8');
  console.log('\n💾 Artículos parseados guardados en scratch/comercio_parsed.json');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
