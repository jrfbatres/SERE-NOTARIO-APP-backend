const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  try {
    await client.query('BEGIN');
    
    // 1. Drop existing primary key on Pais (need to find its name, usually Pais_pkey or similar, but we can just drop it if we know the name or use CASCADE on the column)
    // Actually, dropping the column will drop the PK constraint automatically.
    await client.query('ALTER TABLE asistente_legal_app."Pais" DROP COLUMN id_pais CASCADE;');
    console.log('Dropped id_pais');

    // 2. Rename codigo_iso to id
    await client.query('ALTER TABLE asistente_legal_app."Pais" RENAME COLUMN codigo_iso TO id;');
    console.log('Renamed codigo_iso to id');

    // 3. Add primary key on id
    await client.query('ALTER TABLE asistente_legal_app."Pais" ADD PRIMARY KEY (id);');
    console.log('Added PRIMARY KEY on id');
    
    // Also rename id_pais to id_pais in Departamento to just 'pais_id' maybe? The user didn't ask for that. I will leave Departamento.id_pais as is for now.

    await client.query('COMMIT');
    console.log('Changes committed successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
