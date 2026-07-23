const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await c.connect();
  
  try {
    const planCode = 'P'; // profundo
    const pensumRes = await c.query(`SELECT id, nombre, dias_totales FROM "notarioElite".pensum WHERE ban_plan = $1 LIMIT 1`, [planCode]);
    console.log('Pensum:', pensumRes.rows);

    if(pensumRes.rows.length === 0) return;
    const pensum = pensumRes.rows[0];

    const diasRes = await c.query(`
      SELECT dia, ley_id, nodo_id, cantidad_preguntas
      FROM "notarioElite".pensum_dia 
      WHERE pensum_id = $1 
      ORDER BY dia ASC
    `, [pensum.id]);
    console.log(`Nodos totales: ${diasRes.rows.length}`);

  } catch(e) { console.error(e); } finally { await c.end(); }
}
main();
