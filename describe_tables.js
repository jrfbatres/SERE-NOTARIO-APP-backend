const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  const tables = ['Pais', 'Departamento', 'Distrito', 'Municipio'];
  
  for (const table of tables) {
    console.log(`\n--- Schema for table: ${table} ---`);
    const res = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'asistente_legal_app' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    
    console.table(res.rows);
    
    const pkFkRes = await client.query(`
      SELECT
          tc.constraint_type, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'asistente_legal_app' AND tc.table_name = $1;
    `, [table]);
    console.log('Constraints:');
    console.table(pkFkRes.rows);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
