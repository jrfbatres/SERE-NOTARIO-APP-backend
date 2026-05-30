const fs = require('fs');
const content = fs.readFileSync('c:/Users/jrfba/OneDrive/Desktop/SERE NOTARIO/sere-notario-app/src/app/estudio/[ley]/page.js', 'utf8');
const lines = content.split('\n');

// Extract the miniFinished block between line 530 and 639
let openDivs = 0;
for (let i = 529; i < 638; i++) {
  const line = lines[i];
  // Count divs on this line
  const opens = (line.match(/<div[ >]/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  openDivs += opens - closes;
  console.log(`${i + 1} (+${opens} -${closes} = ${openDivs}): ${line.trim()}`);
}
