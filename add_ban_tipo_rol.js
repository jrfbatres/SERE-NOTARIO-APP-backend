const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const alterQuery = `
    ALTER TABLE asistente_legal_app."CON_ROLES" 
    ADD COLUMN ban_tipo_rol VARCHAR(1) DEFAULT 'P' CHECK (ban_tipo_rol IN ('P', 'B'));
  `;
  
  try {
    await client.query(alterQuery);
    console.log('Added ban_tipo_rol column to CON_ROLES successfully.');
    
    const res = await client.query('SELECT * FROM asistente_legal_app."CON_ROLES" ORDER BY id_rol;');
    console.table(res.rows);
  } catch (e) {
    console.error('Error altering table:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
