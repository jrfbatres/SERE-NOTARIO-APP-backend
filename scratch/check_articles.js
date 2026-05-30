const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function check() {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM "notarioElite".articulos WHERE ley_id = 3');
    console.log('Total articles for ley_id=3:', res.rows[0].count);
    
    const resNull = await pool.query('SELECT COUNT(*) FROM "notarioElite".articulos WHERE ley_id = 3 AND nodo_id IS NULL');
    console.log('Articles for ley_id=3 with nodo_id NULL:', resNull.rows[0].count);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
