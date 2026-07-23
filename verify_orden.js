const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'asistente_legal_app' AND table_name = 'CON_TIPO_BIEN_CAMPOS';
    `);
    console.table(res.rows);
  } catch (e) {
    console.error('Error verifying table structure:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
