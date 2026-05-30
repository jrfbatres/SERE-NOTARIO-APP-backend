const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function main() {
  try {
    const res = await pool.query('SELECT id, numero, tema, contenido, nodo_id FROM "notarioElite".articulos LIMIT 5;');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
