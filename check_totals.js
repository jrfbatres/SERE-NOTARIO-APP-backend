const fs = require('fs');
const data = JSON.parse(fs.readFileSync('leyes_nodos_data.json', 'utf8'));
const activeNodos = data.nodos.filter(n => n.total_preguntas > 0);

const liteNodos = activeNodos.filter(n => n.nivel === 0 || n.nivel === 1);
const totalLite = liteNodos.reduce((sum, n) => sum + n.total_preguntas, 0);

const totalPro = activeNodos.reduce((sum, n) => sum + n.total_preguntas, 0);

console.log(`Total Lite questions: ${totalLite}`);
console.log(`Total Pro questions: ${totalPro}`);
