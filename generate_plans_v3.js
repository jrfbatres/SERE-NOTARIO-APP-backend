const fs = require('fs');

const data = JSON.parse(fs.readFileSync('leyes_nodos_data.json', 'utf8'));
const { leyes, nodos } = data;

const leyesMap = new Map();
leyes.forEach(l => leyesMap.set(l.id, l));

const activeNodos = nodos.filter(n => n.total_preguntas > 0);

// We want exactly ~30 questions per day
function distributeNodesIntoDaysByTarget(nodesList, targetQuestionsPerDay) {
  const days = [];
  let currentDayNodes = [];
  let currentDayQuestions = 0;
  
  nodesList.forEach((n, idx) => {
    currentDayNodes.push(n);
    currentDayQuestions += n.total_preguntas;
    
    // Once we hit or exceed the target, we cut the day here.
    // If a single node has 134 questions, it will be its own day (or we could split it, but the schema doesn't allow splitting nodes easily).
    if (currentDayQuestions >= targetQuestionsPerDay || idx === nodesList.length - 1) {
      days.push({
        nodes: currentDayNodes,
        totalQuestions: currentDayQuestions
      });
      currentDayNodes = [];
      currentDayQuestions = 0;
    }
  });
  
  return days;
}

function formatPlan(title, description, daysList) {
  let plan = `## ${title}\n\n${description}\n\n`;
  
  daysList.forEach((day, index) => {
    if (day.nodes.length === 0) return;
    
    const minutes = day.totalQuestions * 1.5; 
    const timeStr = minutes > 60 
        ? `${Math.floor(minutes/60)}h ${Math.round(minutes%60)}m` 
        : `${Math.round(minutes)}m`;

    plan += `### Día ${index + 1} (Total: ${day.totalQuestions} preguntas | Tiempo estimado: ${timeStr})\n`;
    
    day.nodes.forEach(n => {
      const ley = leyesMap.get(n.ley_id);
      const prefix = n.nivel === 0 ? `**${ley ? ley.nombre : 'Ley'}**` : `  - `;
      const indent = n.nivel > 0 ? '  '.repeat(n.nivel) : '';
      plan += `${indent}- ${n.nombre} (${n.total_preguntas} preguntas)\n`;
    });
    plan += '\n';
  });
  
  return plan;
}

const targetQuestions = 30; // 45 minutes / 1.5 mins = 30 questions

// --- LITE PLAN ---
const liteNodos = activeNodos.filter(n => n.nivel === 0 || n.nivel === 1);
const liteDays = distributeNodesIntoDaysByTarget(liteNodos, targetQuestions);
const litePlanMd = formatPlan(
  `Plan Lite (${liteDays.length} Días) - Nodos Principales`, 
  'Repaso general (Niveles 0 y 1). Meta: ~30 preguntas (45 min) por día.',
  liteDays
);

// --- PRO PLAN ---
const proDays = distributeNodesIntoDaysByTarget(activeNodos, targetQuestions);
const proPlanMd = formatPlan(
  `Plan Pro (${proDays.length} Días) - Estudio Profundo`, 
  'Estudio exhaustivo (Todos los niveles). Meta: ~30 preguntas (45 min) por día.',
  proDays
);

const finalMd = `# Planes de Estudio (Basado en 45 min diarios)\n\n` + litePlanMd + proPlanMd;

fs.writeFileSync('plan_de_estudio_v3.md', finalMd);
