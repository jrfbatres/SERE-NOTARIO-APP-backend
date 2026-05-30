const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  const res = await c.query(`
    SELECT table_schema, table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('preguntas', 'opciones') 
      AND table_schema IN ('public', 'notarioElite')
    ORDER BY table_schema, table_name, ordinal_position
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await c.end();
}
run();
