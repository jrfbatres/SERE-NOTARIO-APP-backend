const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const createTableQuery = `
    CREATE TABLE asistente_legal_app."CON_CATEGORIA_DOCUMENTOS" (
      id_categoria SERIAL PRIMARY KEY,
      id_pais TEXT REFERENCES asistente_legal_app."CON_Pais"(id_pais),
      nombre_categoria TEXT NOT NULL
    );
  `;
  
  try {
    await client.query(createTableQuery);
    console.log('Table CON_CATEGORIA_DOCUMENTOS created successfully.');
  } catch (e) {
    console.error('Error creating table:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
