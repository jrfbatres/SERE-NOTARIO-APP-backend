const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const usuarioNodosCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'notarioElite' AND table_name = 'usuario_nodos'
  `);
  console.log('--- usuario_nodos table ---');
  console.log(usuarioNodosCols.rows);

  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
