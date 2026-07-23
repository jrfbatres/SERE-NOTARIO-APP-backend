const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  // 1. Create ASI_EMPRESA_EMPRESAS
  const createEmpresaClientes = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_EMPRESAS" (
      id_empresa_cliente SERIAL PRIMARY KEY,
      id_empresa INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESAS"(id_empresa) ON DELETE CASCADE
    );
  `;
  await client.query(createEmpresaClientes);
  console.log('Table ASI_EMPRESA_EMPRESAS created.');

  // 2. Create ASI_EMPRESA_EMPRESAS_DET
  const createEmpresaClientesDet = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESA_EMPRESAS_DET" (
      id_empresa_det SERIAL PRIMARY KEY,
      id_empresa_cliente INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESA_EMPRESAS"(id_empresa_cliente) ON DELETE CASCADE,
      campo TEXT NOT NULL,
      valor TEXT
    );
  `;
  await client.query(createEmpresaClientesDet);
  console.log('Table ASI_EMPRESA_EMPRESAS_DET created.');

  // 3. Create Trigger Function for Juridico (Entity 2)
  const createTriggerFunc = `
    CREATE OR REPLACE FUNCTION asistente_legal_app.fn_insert_empresa_cliente_det()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO asistente_legal_app."ASI_EMPRESA_EMPRESAS_DET" (id_empresa_cliente, campo, valor)
        SELECT NEW.id_empresa_cliente, nombre_campo, NULL
        FROM asistente_legal_app."CON_ENTIDAD_CAMPOS"
        WHERE id_entidad = 2; -- 2 es Juridico
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  await client.query(createTriggerFunc);
  console.log('Trigger function for Empresa Cliente created.');

  // 4. Create Trigger
  const createTrigger = `
    DROP TRIGGER IF EXISTS trg_after_insert_empresa_cliente ON asistente_legal_app."ASI_EMPRESA_EMPRESAS";
    CREATE TRIGGER trg_after_insert_empresa_cliente
    AFTER INSERT ON asistente_legal_app."ASI_EMPRESA_EMPRESAS"
    FOR EACH ROW
    EXECUTE FUNCTION asistente_legal_app.fn_insert_empresa_cliente_det();
  `;
  await client.query(createTrigger);
  console.log('Trigger for Empresa Cliente created.');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
