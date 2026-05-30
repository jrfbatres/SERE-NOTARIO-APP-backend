const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'preguntas' AND table_schema = 'notarioElite';
  `);
  console.log('Columns in preguntas:', res.rows);
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
