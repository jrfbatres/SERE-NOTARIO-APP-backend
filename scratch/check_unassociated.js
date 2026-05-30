const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  const res = await c.query('SELECT count(*) as count FROM "notarioElite".preguntas WHERE ley_id = 10 AND nodo_id IS NULL');
  console.log(`Total sin nodo: ${res.rows[0].count}`);
  
  const detail = await c.query('SELECT articulo, id FROM "notarioElite".preguntas WHERE ley_id = 10 AND nodo_id IS NULL LIMIT 10');
  console.table(detail.rows);
  
  await c.end();
}
run();
