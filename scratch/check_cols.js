const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function run() {
  const client = await pool.connect();
  try {
    for (const schema of ['public', '"notarioElite"']) {
      const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = REPLACE('${schema}', '"', '') AND table_name = 'preguntas'`);
      console.log(`Columns for ${schema}.preguntas:`, res.rows.map(r => r.column_name));
    }
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
