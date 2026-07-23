const { Client } = require('pg');

const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'asistente_legal_app'
  `);
  console.log('Tables in asistente_legal_app schema:');
  console.log(res.rows.map(r => r.table_name));
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
