const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT id, nombre, padre_id, total_preguntas, porcentaje_preguntas
    FROM "notarioElite".nodos
    WHERE ley_id = 9
    ORDER BY id
  `);
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
