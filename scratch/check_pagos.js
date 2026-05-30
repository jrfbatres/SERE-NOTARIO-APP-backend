const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function check() {
  const trans = await pool.query("SELECT * FROM wompi_transactions ORDER BY created_at DESC LIMIT 5");
  console.log("Transacciones Webhook Wompi:", trans.rows);

  const pagos = await pool.query("SELECT id, estado, url_enlace FROM usuario_pagos ORDER BY fecha_creacion DESC LIMIT 5");
  const config = await pool.query("SELECT * FROM wompi_config");
  console.log("Wompi Config:", config.rows);

  pool.end();
}
check();
