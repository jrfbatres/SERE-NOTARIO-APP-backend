const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function check() {
  const pagos = await pool.query("SELECT id, usuario_id, estado, url_enlace FROM usuario_pagos ORDER BY id DESC LIMIT 5");
  console.log("Ultimos 5 pagos:", pagos.rows);
  pool.end();
}
check();
