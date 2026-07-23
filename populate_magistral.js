const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgres://postgres:admin@72.61.9.7:1521/batres';
const data = JSON.parse(fs.readFileSync('leyes_nodos_data.json', 'utf8'));

// Smooth distribution logic
function distributeSmoothly(nodesList, numDays) {
  const totalQuestions = nodesList.reduce((sum, n) => sum + n.total_preguntas, 0);
  const questionsPerDay = totalQuestions / numDays; 
  
  const days = [];
  for (let i = 0; i < numDays; i++) {
    days.push({ nodes: [], totalQuestions: 0 });
  }

  let currentDayIdx = 0;
  let currentDayCapacity = Math.round(questionsPerDay * (currentDayIdx + 1)) - Math.round(questionsPerDay * currentDayIdx);

  nodesList.forEach(n => {
    let questionsRemaining = n.total_preguntas;
    
    while (questionsRemaining > 0) {
      if (currentDayCapacity === 0) {
        currentDayIdx++;
        if (currentDayIdx >= numDays) currentDayIdx = numDays - 1;
        
        currentDayCapacity = Math.round(questionsPerDay * (currentDayIdx + 1)) - days.reduce((sum, d) => sum + d.totalQuestions, 0);
      }
      
      const toTake = Math.min(questionsRemaining, currentDayCapacity);
      
      days[currentDayIdx].nodes.push({
        ley_id: n.ley_id,
        nodo_id: n.id, 
        cantidad_preguntas: toTake
      });
      
      days[currentDayIdx].totalQuestions += toTake;
      questionsRemaining -= toTake;
      currentDayCapacity -= toTake;
    }
  });
  
  return days;
}

async function main() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // Begin Transaction
    await client.query('BEGIN');
    
    // Update the Magistral pensum record (30 days = double speed of 60 days)
    const updateRes = await client.query(`
      UPDATE "notarioElite".pensum 
      SET dias_totales = 30, descripcion = 'Plan experto acelerado (30 días, carga doble)' 
      WHERE nombre = 'Magistral' 
      RETURNING id
    `);
    
    if (updateRes.rowCount === 0) {
       console.log('Magistral plan not found!');
       return;
    }
    
    const magistralId = updateRes.rows[0].id;
    
    // Clear out any old days for Magistral just in case
    await client.query(`DELETE FROM "notarioElite".pensum_dia WHERE pensum_id = $1`, [magistralId]);
    
    // Distribute active nodes into 30 days
    const activeNodos = data.nodos.filter(n => n.total_preguntas > 0);
    const magistralDays = distributeSmoothly(activeNodos, 30);
    
    // Insert new data
    const insertDiaQuery = `
      INSERT INTO "notarioElite".pensum_dia (pensum_id, dia, ley_id, nodo_id, cantidad_preguntas)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    let recordsCount = 0;
    for (let dayIdx = 0; dayIdx < magistralDays.length; dayIdx++) {
      for (const node of magistralDays[dayIdx].nodes) {
        await client.query(insertDiaQuery, [magistralId, dayIdx + 1, node.ley_id, node.nodo_id, node.cantidad_preguntas]);
        recordsCount++;
      }
    }
    
    await client.query('COMMIT');
    console.log(`Success! Inserted ${recordsCount} records for the Magistral plan into 30 days.`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', err);
  } finally {
    await client.end();
  }
}

main();
