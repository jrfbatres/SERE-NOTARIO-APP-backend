const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  // 1. Create ASI_EMPRESA_NOTARIO
  const createEmpresaNotario = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_NOTARIO" (
      id_notario SERIAL PRIMARY KEY,
      id_empresa INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESAS"(id_empresa) ON DELETE CASCADE,
      nombre_notario TEXT NOT NULL,
      es_funcionario_publico BOOLEAN DEFAULT false
    );
  `;
  await client.query(createEmpresaNotario);
  console.log('Table ASI_EMPRESA_NOTARIO created.');

  // 2. Create ASI_EMPRESA_DOCUMENTOS
  const createEmpresaDocumentos = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_DOCUMENTOS" (
      id_documento SERIAL PRIMARY KEY,
      id_empresa INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESAS"(id_empresa) ON DELETE CASCADE,
      id_tipo_documento INT NOT NULL REFERENCES asistente_legal_app."CON_TIPO_DOCUMENTOS"(id_tipo_documento),
      id_clasificacion INT,
      es_escritura_publica BOOLEAN DEFAULT false,
      numero_folio INT,
      numero_documento INT,
      numero_pagina INT,
      linea_comienzo INT,
      fecha DATE,
      hora TIME,
      valor NUMERIC(15, 2),
      id_notario INT REFERENCES asistente_legal_app."ASI_EMPRESA_NOTARIO"(id_notario),
      id_pais TEXT,
      id_departamento INT,
      id_distrito INT,
      id_municipio INT
    );
  `;
  await client.query(createEmpresaDocumentos);
  console.log('Table ASI_EMPRESA_DOCUMENTOS created.');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
