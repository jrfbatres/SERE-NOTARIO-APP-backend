const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  
  // Find root node of ley 10
  const rRes = await c.query('SELECT id FROM "notarioElite".nodos WHERE ley_id = 10 AND padre_id IS NULL LIMIT 1');
  const rootId = rRes.rows[0].id;
  
  // Update orphaned questions to root node
  const res = await c.query('UPDATE "notarioElite".preguntas SET nodo_id = $1 WHERE ley_id = 10 AND nodo_id IS NULL', [rootId]);
  console.log(`Asignadas ${res.rowCount} preguntas huérfanas al nodo raíz (${rootId}).`);
  
  await c.end();
}
run();
