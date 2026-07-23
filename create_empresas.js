const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."ASI_EMPRESAS" (
      id_empresa SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      id_pais TEXT,
      id_departamento INT,
      id_distrito INT,
      id_municipio INT
    );
  `;
  
  try {
    await client.query(createTableQuery);
    console.log('Table ASI_EMPRESAS created successfully.');
    
    const insertQuery = `
      INSERT INTO asistente_legal_app."ASI_EMPRESAS" 
      (nombre, id_pais, id_departamento, id_distrito, id_municipio) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(insertQuery, [
      'Tramitadora de Vehiculos San Salvador',
      'SV', // País El Salvador
      14,   // Depto San Salvador
      35,   // Distrito San Salvador Centro
      119   // Municipio San Salvador (perteneciente al distrito San Salvador Centro)
    ]);
    
    console.log('Company inserted successfully.');
    
  } catch (e) {
    console.error('Error:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
