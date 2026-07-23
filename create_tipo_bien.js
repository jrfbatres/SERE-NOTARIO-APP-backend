const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const createQuery = `
    CREATE TABLE asistente_legal_app."CON_TIPO_BIEN" (
      id_tipo_bien SERIAL PRIMARY KEY,
      id_pais TEXT REFERENCES asistente_legal_app."CON_Pais"(id_pais),
      nombre_tipo_bien TEXT NOT NULL,
      ban_escritura_publica VARCHAR(1) DEFAULT 'N' CHECK (ban_escritura_publica IN ('S', 'N'))
    );
  `;
  
  try {
    await client.query(createQuery);
    console.log('Table CON_TIPO_BIEN created successfully.');
  } catch (e) {
    console.error('Error creating table:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
