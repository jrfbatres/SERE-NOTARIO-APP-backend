const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function check() {
  try {
    console.log('Pensums:');
    const res = await pool.query('SELECT id, nombre, ban_plan, dias_totales FROM "notarioElite".pensum');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
