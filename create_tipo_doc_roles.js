const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const createQuery = `
    CREATE TABLE asistente_legal_app."CON_TIPO_DOCUMENTOS_ROLES" (
      id_tipo_documento_rol SERIAL PRIMARY KEY,
      id_tipo_documento INT NOT NULL REFERENCES asistente_legal_app."CON_TIPO_DOCUMENTOS"(id_tipo_documento),
      id_rol INT NOT NULL REFERENCES asistente_legal_app."CON_ROLES"(id_rol),
      cantidad_minima INT DEFAULT 1,
      cantidad_maxima INT DEFAULT NULL, -- NULL representará 'Infinita'
      orden INT NOT NULL,
      UNIQUE(id_tipo_documento, id_rol)
    );
  `;
  
  try {
    await client.query(createQuery);
    console.log('Table CON_TIPO_DOCUMENTOS_ROLES created successfully.');
  } catch (e) {
    console.error('Error creating table:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
