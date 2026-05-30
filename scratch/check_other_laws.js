const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();

  const res = await client.query(`
    SELECT p.ley_id, l.nombre as ley_nombre, COUNT(*) as total_unmapped 
    FROM "notarioElite".preguntas p
    LEFT JOIN "notarioElite".leyes l ON p.ley_id = l.id
    WHERE p.nodo_id IS NULL
    GROUP BY p.ley_id, l.nombre
    ORDER BY p.ley_id
  `);

  console.log("Preguntas sin nodo_id:");
  console.table(res.rows);

  await client.end();
}
run();
