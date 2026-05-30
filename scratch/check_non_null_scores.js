const { Client } = require('pg');

const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT un.usuario_id, u.nombre as usuario, un.nodo_id, n.nombre as nodo, un.nota, un.completado, un.actualizado_en
    FROM "notarioElite".usuario_nodos un
    JOIN "notarioElite".nodos n ON un.nodo_id = n.id
    JOIN "notarioElite".usuarios u ON un.usuario_id = u.id
    WHERE un.nota IS NOT NULL
    ORDER BY un.actualizado_en DESC
    LIMIT 20
  `);
  console.table(res.rows);
  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
