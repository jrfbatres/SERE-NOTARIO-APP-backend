const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
client.connect().then(async () => {
  const res = await client.query(`
    SELECT id, nombre, ley_id, padre_id, concepto, analisis_jurisconsulto, tips_didacticos
    FROM "notarioElite".nodos
    WHERE padre_id IS NULL OR padre_id = 'MAPA CONCEPTUAL' OR padre_id = ''
    LIMIT 20
  `);
  console.log('Root nodes:', res.rows);
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
