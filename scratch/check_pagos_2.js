const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function check() {
  const pagos = await pool.query("SELECT id, usuario_id, estado FROM usuario_pagos");
  console.log("Total Pagos en DB:", pagos.rows.length);
  console.log("Detalles:", pagos.rows);
  pool.end();
}
check();
