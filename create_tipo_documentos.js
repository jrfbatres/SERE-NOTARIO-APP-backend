const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const createTableQuery = `
    CREATE TABLE asistente_legal_app."CON_TIPO_DOCUMENTOS" (
      id_tipo_documento SERIAL PRIMARY KEY,
      id_categoria INT NOT NULL REFERENCES asistente_legal_app."CON_CATEGORIA_DOCUMENTOS"(id_categoria),
      nombre_tipo TEXT NOT NULL
    );
  `;
  
  try {
    await client.query(createTableQuery);
    console.log('Table CON_TIPO_DOCUMENTOS created successfully.');
  } catch (e) {
    console.error('Error creating table:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
