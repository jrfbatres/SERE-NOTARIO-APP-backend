const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

const query = `
ALTER TABLE "notarioElite".usuarios
ADD COLUMN IF NOT EXISTS ban_cambiar_clave BOOLEAN DEFAULT FALSE;
`;

client.connect().then(() => {
  console.log('Connected to DB. Altering table usuarios...');
  return client.query(query);
}).then(res => {
  console.log('Table altered successfully');
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
