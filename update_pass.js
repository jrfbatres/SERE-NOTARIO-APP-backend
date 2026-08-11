const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function updatePassword() {
  const client = new Client({
    connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres',
  });
  
  await client.connect();
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('camila', salt);
  
  const res = await client.query('UPDATE "notarioElite".usuarios SET clave = $1 WHERE correo = $2', [hash, 'robertob@freundsa.com']);
  console.log('Updated user count:', res.rowCount);
  
  await client.end();
}

updatePassword().catch(console.error);
