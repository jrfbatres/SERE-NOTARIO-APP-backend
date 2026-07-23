const { Client } = require('pg');

async function check() {
  const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await c.connect();
  const res = await c.query(`
    SELECT p.nombre, p.dias_totales, COUNT(DISTINCT pd.dia) as dias_poblados, SUM(pd.cantidad_preguntas) as total_qs 
    FROM "notarioElite".pensum p 
    LEFT JOIN "notarioElite".pensum_dia pd ON p.id = pd.pensum_id 
    GROUP BY p.nombre, p.dias_totales
  `);
  console.log(res.rows);
  await c.end();
}

check();
