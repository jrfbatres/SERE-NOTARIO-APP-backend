const fs = require('fs');

const rawText = fs.readFileSync('scratch/codigoFamilia_raw.txt', 'utf8');

const lines = rawText.split('\n');
let cleanedLines = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  // Ignore headers
  if (line === 'ASAMBLEA LEGISLATIVA - REPÚBLICA DE EL SALVADOR') continue;
  if (line.match(/^_{10,}$/)) continue;
  if (line === 'ÍNDICE LEGISLATIVO') continue;
  if (line.match(/^\d+$/)) continue; 
  if (line.match(/^-- \d+ of \d+ --$/)) continue;
  
  if (line) {
    cleanedLines.push(line);
  }
}

const articles = [];
let currentArt = null;
let currentContent = [];

for (let line of cleanedLines) {
  const match = line.match(/^Art\.\s*(\d+)\.-\s*(.*)/);
  if (match) {
    if (currentArt) {
      // Remove trailing structural headers from content
      // Often things like TÍTULO, CAPÍTULO appear before the next Art.
      // We will leave them for now or clean them.
      articles.push({
        numero: currentArt,
        contenido: currentContent.join('\n')
      });
    }
    currentArt = match[1];
    currentContent = [match[2]];
  } else if (currentArt) {
    // Check if line is a structural header and ignore it if it's all caps and short?
    // For now, just append it.
    currentContent.push(line);
  }
}

if (currentArt) {
  articles.push({
    numero: currentArt,
    contenido: currentContent.join('\n')
  });
}

// Clean trailing headers from contents
const finalArticles = articles.map(a => {
  const lines = a.contenido.split('\n');
  const cleanLines = [];
  for (let l of lines) {
    if (l.match(/^(TÍTULO|CAPÍTULO|SECCIÓN|LIBRO|PARTE|SUBCAPÍTULO)/) || l === l.toUpperCase() && l.length < 50) {
      // It's likely a header for the NEXT section, but wait... if it's here, it appeared AFTER the article text.
      // Wait, some text in all caps could be part of the article. Let's just keep it, or we can clean it later if needed.
    }
    cleanLines.push(l);
  }
  return { ...a, contenido: cleanLines.join('\n').trim() };
});

fs.writeFileSync('scratch/familia_articulos.json', JSON.stringify(finalArticles, null, 2));
console.log(`Parsed ${finalArticles.length} articles.`);
