const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const alterTableQuery = `
    ALTER TABLE asistente_legal_app."CON_CATEGORIA_DOCUMENTOS" 
    ADD COLUMN ban_escritura VARCHAR(1) DEFAULT 'N' CHECK (ban_escritura IN ('S', 'N'));
  `;
  
  try {
    await client.query(alterTableQuery);
    console.log('Added ban_escritura column to CON_CATEGORIA_DOCUMENTOS successfully.');
  } catch (e) {
    console.error('Error altering table:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
