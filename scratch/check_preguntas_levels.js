const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const res = await client.query(`
    SELECT nivel, COUNT(*) 
    FROM "notarioElite".preguntas 
    GROUP BY nivel;
  `);
  console.log('Distinct levels in preguntas:', res.rows);
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
