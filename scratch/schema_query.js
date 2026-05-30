const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function getSchema() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'notarioElite' 
      AND table_name IN ('articulos', 'nodos');
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

getSchema();
