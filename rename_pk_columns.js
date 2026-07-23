const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const renames = [
    { table: 'CON_Pais', newCol: 'id_pais' },
    { table: 'CON_Departamento', newCol: 'id_departamento' },
    { table: 'CON_Distrito', newCol: 'id_distrito' },
    { table: 'CON_Municipio', newCol: 'id_municipio' }
  ];
  
  try {
    await client.query('BEGIN');
    
    for (const { table, newCol } of renames) {
      await client.query(`ALTER TABLE asistente_legal_app."${table}" RENAME COLUMN id TO ${newCol};`);
      console.log(`Renamed id to ${newCol} in ${table}`);
    }
    
    await client.query('COMMIT');
    console.log('All primary key columns renamed successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error renaming columns:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
