const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const createDocumentosBien = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_DOCUMENTOS_BIEN" (
      id_documento_bien SERIAL PRIMARY KEY,
      id_documento INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESA_DOCUMENTOS"(id_documento) ON DELETE CASCADE,
      id_empresa INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESAS"(id_empresa),
      id_tipo_bien INT NOT NULL REFERENCES asistente_legal_app."CON_TIPO_BIEN"(id_tipo_bien),
      campo TEXT NOT NULL,
      valor TEXT
    );
  `;
  await client.query(createDocumentosBien);
  console.log('Table ASI_EMPRESA_DOCUMENTOS_BIEN created.');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
