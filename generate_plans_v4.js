const fs = require('fs');

const data = JSON.parse(fs.readFileSync('leyes_nodos_data.json', 'utf8'));
const { leyes, nodos } = data;

const leyesMap = new Map();
leyes.forEach(l => leyesMap.set(l.id, l));

const activeNodos = nodos.filter(n => n.total_preguntas > 0);

// Flatten into blocks
function distributeSmoothly(nodesList, numDays) {
  const totalQuestions = nodesList.reduce((sum, n) => sum + n.total_preguntas, 0);
  const questionsPerDay = totalQuestions / numDays; // Floating point target
  
  const days = [];
  for (let i = 0; i < numDays; i++) {
    days.push({ nodes: [], totalQuestions: 0 });
  }

  let currentDayIdx = 0;
  let currentDayCapacity = Math.round(questionsPerDay * (currentDayIdx + 1)) - Math.round(questionsPerDay * currentDayIdx);

  nodesList.forEach(n => {
    let questionsRemaining = n.total_preguntas;
    let partNumber = 1;
    
    while (questionsRemaining > 0) {
      if (currentDayCapacity === 0) {
        currentDayIdx++;
        // Avoid out of bounds if floating point math creates an extra slice
        if (currentDayIdx >= numDays) currentDayIdx = numDays - 1;
        
        currentDayCapacity = Math.round(questionsPerDay * (currentDayIdx + 1)) - days.reduce((sum, d) => sum + d.totalQuestions, 0);
      }
      
      const toTake = Math.min(questionsRemaining, currentDayCapacity);
      
      const nodeName = (toTake < n.total_preguntas) ? `${n.nombre} (Parte ${partNumber})` : n.nombre;
      
      days[currentDayIdx].nodes.push({
        ...n,
        nombre: nodeName,
        preguntas_asignadas: toTake
      });
      
      days[currentDayIdx].totalQuestions += toTake;
      questionsRemaining -= toTake;
      currentDayCapacity -= toTake;
      partNumber++;
    }
  });
  
  return days;
}

function formatPlan(title, description, daysList) {
  let plan = `## ${title}\n\n${description}\n\n`;
  
  daysList.forEach((day, index) => {
    if (day.totalQuestions === 0) return;
    
    const minutes = day.totalQuestions * 1.5; 
    const timeStr = minutes > 60 
        ? `${Math.floor(minutes/60)}h ${Math.round(minutes%60)}m` 
        : `${Math.round(minutes)}m`;

    plan += `### Día ${index + 1} (Total: ${day.totalQuestions} preguntas | Tiempo estimado: ${timeStr})\n`;
    
    // Group by Ley for prettier formatting
    let currentLeyId = null;
    day.nodes.forEach(n => {
      if (n.ley_id !== currentLeyId) {
        const ley = leyesMap.get(n.ley_id);
        plan += `**${ley ? ley.nombre : 'Ley'}**\n`;
        currentLeyId = n.ley_id;
      }
      const indent = n.nivel > 0 ? '  '.repeat(n.nivel) : '  ';
      plan += `${indent}- ${n.nombre} (${n.preguntas_asignadas} preguntas)\n`;
    });
    plan += '\n';
  });
  
  return plan;
}

// --- LITE PLAN ---
const liteNodos = activeNodos.filter(n => n.nivel === 0 || n.nivel === 1);
const liteDays = distributeSmoothly(liteNodos, 20);
const litePlanMd = formatPlan(
  `Plan Lite (20 Días) - Nodos Principales`, 
  'Repaso general (Niveles 0 y 1). Distribuido equitativamente en exactamente 20 días.',
  liteDays
);

// --- PRO PLAN ---
const proDays = distributeSmoothly(activeNodos, 60);
const proPlanMd = formatPlan(
  `Plan Pro (60 Días) - Estudio Profundo`, 
  'Estudio exhaustivo (Todos los niveles). Distribuido equitativamente en exactamente 60 días dividiendo temas extensos.',
  proDays
);

const finalMd = `# Planes de Estudio Distribuidos Exactos\n\n` + litePlanMd + proPlanMd;

fs.writeFileSync('plan_de_estudio_v4.md', finalMd);
