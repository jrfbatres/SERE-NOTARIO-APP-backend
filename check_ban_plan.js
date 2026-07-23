const { Client } = require('pg');

async function check() {
  const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await c.connect();
  const res = await c.query(`
    SELECT DISTINCT ban_plan 
    FROM "notarioElite".usuarios
  `);
  console.log(res.rows);
  await c.end();
}

check();
