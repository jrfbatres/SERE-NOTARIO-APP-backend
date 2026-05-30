const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();
  const res1 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'notarioElite' AND table_name = 'pregunta_articulos'");
  console.log('Schema pregunta_articulos:');
  console.table(res1.rows);
  
  const res2 = await client.query('SELECT id, articulo, texto_pregunta FROM "notarioElite".preguntas WHERE ley_id = 3 LIMIT 2');
  console.log('Sample notarioElite.preguntas:');
  console.table(res2.rows);
  
  await client.end();
}
run();
