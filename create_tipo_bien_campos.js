const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const createQuery = `
    CREATE TABLE asistente_legal_app."CON_TIPO_BIEN_CAMPOS" (
      id_tipo_bien_campo SERIAL PRIMARY KEY,
      id_tipo_bien INT NOT NULL REFERENCES asistente_legal_app."CON_TIPO_BIEN"(id_tipo_bien),
      nombre_campo TEXT NOT NULL,
      tipo_dato VARCHAR(20) NOT NULL CHECK (tipo_dato IN ('TEXTO', 'FECHA', 'NUMERICO', 'MONEDA')),
      ancho INT,
      es_obligatorio VARCHAR(1) DEFAULT 'S' CHECK (es_obligatorio IN ('S', 'N')),
      validacion TEXT
    );
  `;
  
  try {
    await client.query(createQuery);
    console.log('Table CON_TIPO_BIEN_CAMPOS created successfully.');
  } catch (e) {
    console.error('Error creating table:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
