const fs = require('fs');

const data = JSON.parse(fs.readFileSync('leyes_nodos_data.json', 'utf8'));
const { leyes, nodos } = data;

// Map leyes by id
const leyesMap = new Map();
leyes.forEach(l => leyesMap.set(l.id, l));

// Filter out nodes with 0 questions
const activeNodos = nodos.filter(n => n.total_preguntas > 0);

// Helper function to distribute items into buckets (days) as evenly as possible based on a weight (questions)
// Wait, to keep the hierarchy/order, we just iterate and cut off when a day reaches the target average questions.
function distributeNodesIntoDays(nodesList, numDays) {
  const totalQuestions = nodesList.reduce((sum, n) => sum + n.total_preguntas, 0);
  const targetPerDay = Math.ceil(totalQuestions / numDays);
  
  const days = [];
  let currentDayNodes = [];
  let currentDayQuestions = 0;
  
  nodesList.forEach((n, idx) => {
    currentDayNodes.push(n);
    currentDayQuestions += n.total_preguntas;
    
    // If we reached the target for the day (and we still have days left to fill), cut here
    // or if it's the last node.
    if ((currentDayQuestions >= targetPerDay && days.length < numDays - 1) || idx === nodesList.length - 1) {
      days.push({
        nodes: currentDayNodes,
        totalQuestions: currentDayQuestions
      });
      currentDayNodes = [];
      currentDayQuestions = 0;
    }
  });
  
  // In case some days were left empty due to uneven distribution
  while (days.length < numDays) {
    days.push({ nodes: [], totalQuestions: 0 });
  }
  
  return days;
}

// Format the plan
function formatPlan(title, description, daysList) {
  let plan = `## ${title}\n\n${description}\n\n`;
  
  daysList.forEach((day, index) => {
    if (day.nodes.length === 0) return;
    
    const minutes = day.totalQuestions * 1.5; // Assume 1.5 minutes per question
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

// --- LITE PLAN ---
// Nivel 0 and 1 only
const liteNodos = activeNodos.filter(n => n.nivel === 0 || n.nivel === 1);
const liteDays = distributeNodesIntoDays(liteNodos, 20);
const litePlanMd = formatPlan(
  'Plan Lite (20 Días) - Nodos Principales', 
  'Repaso general enfocado en los temas principales (Niveles 0 y 1). Solo se incluyen temas que contienen preguntas. El tiempo estimado asume ~1.5 minutos por pregunta.',
  liteDays
);

// --- PRO PLAN ---
// All levels
const proDays = distributeNodesIntoDays(activeNodos, 60);
const proPlanMd = formatPlan(
  'Plan Pro (60 Días) - Estudio Profundo a Detalle', 
  'Estudio exhaustivo que incluye todos los niveles jerárquicos (temas y subtemas). Solo se incluyen nodos que contienen preguntas. El tiempo estimado asume ~1.5 minutos por pregunta.',
  proDays
);

const finalMd = `# Planes de Estudio Optimizados: Notario Elite\n\n` + litePlanMd + proPlanMd;

fs.writeFileSync('plan_de_estudio_v2.md', finalMd);
