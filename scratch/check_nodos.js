const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  const res = await c.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'notarioElite' AND table_name = 'nodos'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await c.end();
}
run();
