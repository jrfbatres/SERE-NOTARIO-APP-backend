const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  // 1. Create table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESAS_USUARIOS" (
      id_usuario SERIAL PRIMARY KEY,
      id_empresa INT NOT NULL REFERENCES asistente_legal_app."ASI_EMPRESAS"(id_empresa),
      nombre TEXT NOT NULL,
      clave TEXT NOT NULL
    );
  `;
  await client.query(createTableQuery);
  console.log('Table ASI_EMPRESAS_USUARIOS created successfully.');
  
  // 2. Get id_empresa
  const resEmpresa = await client.query(`SELECT id_empresa FROM asistente_legal_app."ASI_EMPRESAS" WHERE nombre = 'Tramitadora de Vehiculos San Salvador' LIMIT 1`);
  if (resEmpresa.rows.length === 0) {
    console.error('Empresa no encontrada.');
    await client.end();
    return;
  }
  const idEmpresa = resEmpresa.rows[0].id_empresa;
  
  // 3. Encrypt password using bcryptjs
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('VCamila26', salt);
  console.log('Password encrypted successfully with bcryptjs.');
  
  // 4. Insert user
  const insertQuery = `
    INSERT INTO asistente_legal_app."ASI_EMPRESAS_USUARIOS" 
    (id_empresa, nombre, clave) 
    VALUES ($1, $2, $3)
  `;
  
  await client.query(insertQuery, [idEmpresa, 'roberto', hash]);
  console.log('User "roberto" inserted successfully.');
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
