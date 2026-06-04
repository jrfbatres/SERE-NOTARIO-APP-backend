const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'notarioElite'
  `);
  console.log('Tables:', tables.rows.map(r => r.table_name));

  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
