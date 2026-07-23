const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

pool.query('CREATE SCHEMA IF NOT EXISTS "asistente-smart"')
  .then(() => {
    console.log('Schema created successfully');
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
