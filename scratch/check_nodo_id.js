const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  const res = await c.query('SELECT count(*) as total, count(nodo_id) as con_nodo FROM "notarioElite".preguntas WHERE ley_id=10');
  console.log(res.rows);
  await c.end();
}
run();
