const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'notarioElite' AND table_name = 'nodos'");
  console.table(res.rows);
  await client.end();
}
run();
