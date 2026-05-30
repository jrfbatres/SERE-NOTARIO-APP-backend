const fs = require('fs');
const path = 'c:/Users/jrfba/OneDrive/Desktop/SERE NOTARIO/sere-notario-app/src/app/estudio/[ley]/page.js';

let content = fs.readFileSync(path, 'utf8');

// Remove the specific comment line
content = content.replace(/\{\/\* Question review detail \*\/\}/g, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully removed comment from page.js');
