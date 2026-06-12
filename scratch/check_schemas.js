const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name IN ('preguntas', 'opciones')");
    console.log(res.rows);
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
