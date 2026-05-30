const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function queryNodes() {
  try {
    const res = await pool.query(`SELECT id, nombre, nivel FROM "notarioElite".nodos WHERE ley_id = 3`);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
queryNodes();
