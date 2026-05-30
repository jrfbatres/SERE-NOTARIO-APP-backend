import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres',
});

// Helper function to query the database
export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;
