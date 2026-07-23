const fs = require('fs');

const data = JSON.parse(fs.readFileSync('leyes_nodos_data.json', 'utf8'));
const { leyes, nodos } = data;

// Map leyes by id
const leyesMap = new Map();
leyes.forEach(l => leyesMap.set(l.id, l));

// Distribute nodes for Lite Plan (20 days)
// Lite plan focuses on Nivel 0 and Nivel 1
const liteNodos = nodos.filter(n => n.nivel === 0 || n.nivel === 1);
const liteNodesPerDay = Math.ceil(liteNodos.length / 20);

let litePlan = '## Plan Lite (20 Días) - Nodos Principales\n\nEste plan está diseñado para un repaso general, abarcando únicamente las leyes y sus temas principales (Nodos nivel 0 y 1).\n\n';
let currentDay = 1;
let currentCount = 0;
litePlan += `### Día 1\n`;

liteNodos.forEach((n, index) => {
  if (currentCount >= liteNodesPerDay && currentDay < 20) {
    currentDay++;
    currentCount = 0;
    litePlan += `\n### Día ${currentDay}\n`;
  }
  const ley = leyesMap.get(n.ley_id);
  const prefix = n.nivel === 0 ? `**${ley ? ley.nombre : 'Ley'}**` : `  - `;
  litePlan += `${prefix} ${n.nombre}\n`;
  currentCount++;
});

// Distribute all nodes for Pro Plan (60 days)
// Pro plan focuses on all levels, going deep into child nodes
const proNodesPerDay = Math.ceil(nodos.length / 60);

let proPlan = '\n\n## Plan Pro (60 Días) - Estudio Profundo a Detalle\n\nEste plan incluye todos los niveles, desde las leyes principales hasta los subtemas más específicos (Nodos hijos).\n\n';
currentDay = 1;
currentCount = 0;
proPlan += `### Día 1\n`;

nodos.forEach((n, index) => {
  if (currentCount >= proNodesPerDay && currentDay < 60) {
    currentDay++;
    currentCount = 0;
    proPlan += `\n### Día ${currentDay}\n`;
  }
  const ley = leyesMap.get(n.ley_id);
  const indent = '  '.repeat(n.nivel);
  proPlan += `${indent}- ${n.nombre} ${n.total_preguntas > 0 ? `(${n.total_preguntas} preguntas)` : ''}\n`;
  currentCount++;
});

const finalMd = `# Planes de Estudio: Notario Elite\n\n` + litePlan + proPlan;

fs.writeFileSync('plan_de_estudio.md', finalMd);
