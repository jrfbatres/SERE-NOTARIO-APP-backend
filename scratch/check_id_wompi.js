const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function check() {
  const pagos = await pool.query("SELECT id, estado, id_wompi FROM usuario_pagos ORDER BY id DESC LIMIT 2");
  console.log("Ultimos pagos:", pagos.rows);
  pool.end();
}
check();
