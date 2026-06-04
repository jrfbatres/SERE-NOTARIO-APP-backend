const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const result = await client.query(`
    SELECT id, nombre, padre_id, nivel 
    FROM "notarioElite".nodos
    WHERE ley_id = 1 AND nivel = 1
    LIMIT 5
  `);
  console.log('Nodos Nivel 1 Ley 1:', result.rows);
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
