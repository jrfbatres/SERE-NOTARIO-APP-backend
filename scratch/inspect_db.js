const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
client.connect().then(async () => {
  // Check current state of Código de Comercio (ley_id=2)
  const artCount = await client.query(`SELECT COUNT(*) as total FROM "notarioElite".articulos WHERE ley_id = 2`);
  console.log('Articulos en Código de Comercio:', artCount.rows[0].total);

  const nodoCount = await client.query(`SELECT COUNT(*) as total FROM "notarioElite".nodos WHERE ley_id = 2`);
  console.log('Nodos en Código de Comercio:', nodoCount.rows[0].total);

  const pregCount = await client.query(`SELECT COUNT(*) as total FROM "notarioElite".preguntas WHERE ley_id = 2`);
  console.log('Preguntas en Código de Comercio:', pregCount.rows[0].total);

  const leyInfo = await client.query(`SELECT * FROM "notarioElite".leyes WHERE id = 2`);
  console.log('Info de la ley:', leyInfo.rows[0]);

  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
