const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

pool.query('SELECT numero, tema FROM "notarioElite".articulos WHERE nodo_id IN (SELECT id FROM "notarioElite".nodos WHERE ley_id = 2) LIMIT 5')
  .then(res => {
    console.log(res.rows);
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
