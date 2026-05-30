const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
client.connect().then(() => {
  return client.query('SELECT id, nombre, correo, clave, ban_pago, fecha_vence FROM "notarioElite".usuarios WHERE correo = $1', ['admin@serenotario.com']);
}).then(res => {
  console.log('Result:', res.rows);
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
