const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  // 1. Create ASI_EMPRESA_DUI
  const createEmpresaDUI = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_DUI" (
      id_dui SERIAL PRIMARY KEY,
      id_empresa INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESAS"(id_empresa) ON DELETE CASCADE
    );
  `;
  await client.query(createEmpresaDUI);
  console.log('Table ASI_EMPRESA_DUI created.');

  // 2. Create ASI_EMPRESA_DUI_DET
  const createEmpresaDUIDet = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_DUI_DET" (
      id_dui_det SERIAL PRIMARY KEY,
      id_dui INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESA_DUI"(id_dui) ON DELETE CASCADE,
      campo TEXT NOT NULL,
      valor TEXT
    );
  `;
  await client.query(createEmpresaDUIDet);
  console.log('Table ASI_EMPRESA_DUI_DET created.');

  // 3. Create Trigger Function
  const createTriggerFunc = `
    CREATE OR REPLACE FUNCTION asistente_legal_app.fn_insert_dui_det()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO asistente_legal_app."ASI_EMPRESA_DUI_DET" (id_dui, campo, valor)
        SELECT NEW.id_dui, nombre_campo, NULL
        FROM asistente_legal_app."CON_ENTIDAD_CAMPOS"
        WHERE id_entidad = 1;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  await client.query(createTriggerFunc);
  console.log('Trigger function created.');

  // 4. Create Trigger
  const createTrigger = `
    DROP TRIGGER IF EXISTS trg_after_insert_dui ON asistente_legal_app."ASI_EMPRESA_DUI";
    CREATE TRIGGER trg_after_insert_dui
    AFTER INSERT ON asistente_legal_app."ASI_EMPRESA_DUI"
    FOR EACH ROW
    EXECUTE FUNCTION asistente_legal_app.fn_insert_dui_det();
  `;
  await client.query(createTrigger);
  console.log('Trigger created.');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
