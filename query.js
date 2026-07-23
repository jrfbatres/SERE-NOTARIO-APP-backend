const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });
client.connect()
  .then(() => client.query('SELECT p.id FROM "notarioElite".preguntas p JOIN "notarioElite".nodos n ON p.nodo_id = n.id WHERE n.nombre LIKE \'%Cierre%\''))
  .then(res => { console.log('Questions found:', res.rows.length); return client.end(); })
  .catch(console.error);
