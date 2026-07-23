const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const insertQuery = `
    INSERT INTO asistente_legal_app."CON_CATEGORIA_DOCUMENTOS" (nombre_categoria, ban_escritura)
    VALUES 
      ('Documento Privado Autenticado', 'N'),
      ('Escritura Publica', 'S')
    RETURNING *;
  `;
  
  try {
    const res = await client.query(insertQuery);
    console.log('Inserted rows:');
    console.table(res.rows);
  } catch (e) {
    console.error('Error inserting rows:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
