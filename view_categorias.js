const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const res = await client.query('SELECT * FROM asistente_legal_app."CON_CATEGORIA_DOCUMENTOS";');
  console.table(res.rows);
  client.end();
});
