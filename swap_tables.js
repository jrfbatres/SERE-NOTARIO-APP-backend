const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  try {
    await client.query('BEGIN');
    
    // Rename Municipio -> Distrito_temp
    await client.query('ALTER TABLE asistente_legal_app."Municipio" RENAME TO "Distrito_temp";');
    
    // Rename Distrito -> Municipio
    await client.query('ALTER TABLE asistente_legal_app."Distrito" RENAME TO "Municipio";');
    
    // Rename Distrito_temp -> Distrito
    await client.query('ALTER TABLE asistente_legal_app."Distrito_temp" RENAME TO "Distrito";');
    
    // The table that is now "Municipio" (was Distrito) has the column id_municipio. We rename it to id_distrito.
    await client.query('ALTER TABLE asistente_legal_app."Municipio" RENAME COLUMN id_municipio TO id_distrito;');
    
    await client.query('COMMIT');
    console.log('Tables swapped successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error swapping tables:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
