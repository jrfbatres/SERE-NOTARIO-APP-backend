const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();

  try {
    // 1. Get total number of questions for ley_id = 3
    const resTotal = await client.query('SELECT COUNT(*) as total FROM "notarioElite".preguntas WHERE ley_id = 3');
    const grandTotal = parseInt(resTotal.rows[0].total) || 1; // Avoid division by zero
    console.log(`Total questions for ley_id 3: ${grandTotal}`);

    // 2. Get all nodes for ley_id = 3
    const resNodos = await client.query('SELECT id, padre_id FROM "notarioElite".nodos WHERE ley_id = 3');
    const nodos = resNodos.rows;
    
    // We need to calculate questions for each node including its descendants
    // Let's use a recursive CTE for each node to get all its descendants, 
    // or just calculate it in memory.
    // First, let's get direct questions count for each node
    const resDirect = await client.query(`
      SELECT nodo_id, COUNT(*) as count 
      FROM "notarioElite".preguntas 
      WHERE ley_id = 3 AND nodo_id IS NOT NULL 
      GROUP BY nodo_id
    `);
    
    const directCounts = {};
    for (const row of resDirect.rows) {
      directCounts[row.nodo_id] = parseInt(row.count);
    }
    
    // Helper to get all descendants including self
    function getDescendants(nodeId) {
      let descendants = [nodeId];
      const children = nodos.filter(n => n.padre_id === nodeId);
      for (const child of children) {
        descendants = descendants.concat(getDescendants(child.id));
      }
      return descendants;
    }

    let updatedCount = 0;

    // Calculate and update for each node
    for (const node of nodos) {
      const descendants = getDescendants(node.id);
      let total_preguntas = 0;
      
      for (const descId of descendants) {
        if (directCounts[descId]) {
          total_preguntas += directCounts[descId];
        }
      }
      
      let porcentaje = (total_preguntas / grandTotal) * 100;
      // Round to 2 decimal places
      porcentaje = Math.round(porcentaje * 100) / 100;

      await client.query(
        'UPDATE "notarioElite".nodos SET total_preguntas = $1, porcentaje_preguntas = $2 WHERE id = $3',
        [total_preguntas, porcentaje, node.id]
      );
      
      updatedCount++;
    }

    console.log(`Estadísticas actualizadas para ${updatedCount} nodos.`);
  } catch (error) {
    console.error('Error calculando estadísticas:', error);
  } finally {
    await client.end();
  }
}

run();
