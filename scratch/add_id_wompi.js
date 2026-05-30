const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function main() {
  try {
    await pool.query(`ALTER TABLE usuario_pagos ADD COLUMN IF NOT EXISTS id_wompi INT;`);
    console.log("Columna id_wompi agregada a usuario_pagos.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();
