const { Client } = require('pg');

const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

const keepTables = ['Pais', 'Departamento', 'Distrito', 'Municipio'].map(t => t.toLowerCase());

client.connect().then(async () => {
  console.log('Connected to DB');
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'asistente_legal_app'
  `);
  
  const allTables = res.rows.map(r => r.table_name);
  const tablesToDrop = allTables.filter(t => !keepTables.includes(t.toLowerCase()));
  
  if (tablesToDrop.length === 0) {
    console.log('No tables to drop.');
    return;
  }
  
  console.log('Dropping tables:', tablesToDrop);
  
  for (const tableName of tablesToDrop) {
    try {
      await client.query(`DROP TABLE IF EXISTS asistente_legal_app."${tableName}" CASCADE;`);
      console.log(`Dropped ${tableName}`);
    } catch (e) {
      console.error(`Error dropping ${tableName}:`, e.message);
    }
  }
  
  console.log('Finished dropping tables.');
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
