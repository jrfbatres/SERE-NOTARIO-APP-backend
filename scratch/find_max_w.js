const fs = require('fs');

const files = [
  'c:/Users/jrfba/OneDrive/Desktop/SERE NOTARIO/sere-notario-app/src/app/estudio/[ley]/page.js',
  'c:/Users/jrfba/OneDrive/Desktop/SERE NOTARIO/sere-notario-app/src/app/simulador/[nodo]/page.js'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  console.log(`\n=== File: ${file} ===`);
  lines.forEach((line, i) => {
    if (line.includes('max-w-')) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  });
});
