const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const tables = ['Pais', 'Departamento', 'Distrito', 'Municipio'];
  
  try {
    await client.query('BEGIN');
    
    for (const table of tables) {
      const newName = `CON_${table}`;
      await client.query(`ALTER TABLE asistente_legal_app."${table}" RENAME TO "${newName}";`);
      console.log(`Renamed ${table} to ${newName}`);
    }
    
    await client.query('COMMIT');
    console.log('All tables renamed successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error renaming tables:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
