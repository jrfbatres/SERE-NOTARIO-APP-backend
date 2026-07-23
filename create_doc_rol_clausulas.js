const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  // 1. Create ASI_EMPRESA_DOCUMENTOS_ROL
  const createDocumentosRol = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_DOCUMENTOS_ROL" (
      id_documento_rol SERIAL PRIMARY KEY,
      id_documento INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESA_DOCUMENTOS"(id_documento) ON DELETE CASCADE,
      id_rol INT REFERENCES asistente_legal_app."CON_ROLES"(id_rol),
      id_dui INT REFERENCES asistente_legal_app."ASI_EMPRESA_DUI"(id_dui),
      id_empresa_det INT -- Mantenemos el nombre de campo que solicitaste
    );
  `;
  await client.query(createDocumentosRol);
  console.log('Table ASI_EMPRESA_DOCUMENTOS_ROL created.');

  // 2. Create ASI_EMPRESA_DOCUMENTOS_CLAUSULAS
  const createDocumentosClausulas = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_DOCUMENTOS_CLAUSULAS" (
      id_documento_clausula SERIAL PRIMARY KEY,
      id_documento INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESA_DOCUMENTOS"(id_documento) ON DELETE CASCADE,
      id_clausula INT REFERENCES asistente_legal_app."CON_TIPO_DOCUMENTO_CLAUSULAS"(id_tipo_documento_clausula),
      valor TEXT,
      bandera VARCHAR(1) DEFAULT '1'
    );
  `;
  await client.query(createDocumentosClausulas);
  console.log('Table ASI_EMPRESA_DOCUMENTOS_CLAUSULAS created.');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
