const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usuarios'")
  .then(res => { console.log(res.rows); pool.end(); });
