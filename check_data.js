const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const mRes = await client.query('SELECT * FROM asistente_legal_app."Municipio" LIMIT 5;');
  console.log('Municipio rows:');
  console.table(mRes.rows);

  const dRes = await client.query('SELECT * FROM asistente_legal_app."Distrito" LIMIT 5;');
  console.log('Distrito rows:');
  console.table(dRes.rows);
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
