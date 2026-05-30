const fs = require('fs');
const content = fs.readFileSync('c:/Users/jrfba/OneDrive/Desktop/SERE NOTARIO/sere-notario-app/src/app/estudio/[ley]/page.js', 'utf8');
const lines = content.split('\n');

for (let i = 598; i < 615; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
