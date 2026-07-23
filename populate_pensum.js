const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgres://postgres:admin@72.61.9.7:1521/batres';
const data = JSON.parse(fs.readFileSync('leyes_nodos_data.json', 'utf8'));

// Smooth distribution logic from v4
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
    console.log('Connected to DB');
    
    await client.query('BEGIN');
    
    // 1. Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "notarioElite".pensum (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        descripcion TEXT,
        dias_totales INTEGER NOT NULL
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "notarioElite".pensum_dia (
        id SERIAL PRIMARY KEY,
        pensum_id INTEGER REFERENCES "notarioElite".pensum(id) ON DELETE CASCADE,
        dia INTEGER NOT NULL,
        ley_id INTEGER NOT NULL,
        nodo_id VARCHAR(255) NOT NULL,
        cantidad_preguntas INTEGER NOT NULL
      )
    `);
    
    // Clear out any old data just in case
    await client.query(`TRUNCATE "notarioElite".pensum_dia RESTART IDENTITY CASCADE`);
    await client.query(`TRUNCATE "notarioElite".pensum RESTART IDENTITY CASCADE`);
    
    // 2. Insert Pensums
    const insertPensumQuery = `
      INSERT INTO "notarioElite".pensum (nombre, descripcion, dias_totales)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    const liteRes = await client.query(insertPensumQuery, ['Lite / Express', 'Plan general de 20 días', 20]);
    const liteId = liteRes.rows[0].id;
    
    const proRes = await client.query(insertPensumQuery, ['Profundo', 'Plan detallado de 60 días', 60]);
    const proId = proRes.rows[0].id;
    
    // Magistral - placeholder
    await client.query(insertPensumQuery, ['Magistral', 'Plan experto (TBD)', 0]);
    
    // 3. Prepare nodes
    const activeNodos = data.nodos.filter(n => n.total_preguntas > 0);
    const liteNodos = activeNodos.filter(n => n.nivel === 0 || n.nivel === 1);
    
    // 4. Distribute
    const liteDays = distributeSmoothly(liteNodos, 20);
    const proDays = distributeSmoothly(activeNodos, 60);
    
    // 5. Insert into pensum_dia
    const insertDiaQuery = `
      INSERT INTO "notarioElite".pensum_dia (pensum_id, dia, ley_id, nodo_id, cantidad_preguntas)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    let liteRecords = 0;
    for (let dayIdx = 0; dayIdx < liteDays.length; dayIdx++) {
      for (const node of liteDays[dayIdx].nodes) {
        await client.query(insertDiaQuery, [liteId, dayIdx + 1, node.ley_id, node.nodo_id, node.cantidad_preguntas]);
        liteRecords++;
      }
    }
    
    let proRecords = 0;
    for (let dayIdx = 0; dayIdx < proDays.length; dayIdx++) {
      for (const node of proDays[dayIdx].nodes) {
        await client.query(insertDiaQuery, [proId, dayIdx + 1, node.ley_id, node.nodo_id, node.cantidad_preguntas]);
        proRecords++;
      }
    }
    
    await client.query('COMMIT');
    console.log(`Success! Inserted ${liteRecords} records for Lite plan and ${proRecords} records for Pro plan.`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', err);
  } finally {
    await client.end();
  }
}

main();
