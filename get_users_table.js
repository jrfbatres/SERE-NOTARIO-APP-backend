const { Client } = require('pg');

async function getUsuarios() {
  const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await c.connect();
  const res = await c.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'notarioElite' 
    AND table_name LIKE '%usuar%'
    OR table_name LIKE '%user%'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await c.end();
}

getUsuarios();
