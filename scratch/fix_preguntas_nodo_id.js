const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  
  const qRes = await c.query(`
    SELECT pa.pregunta_id, a.nodo_id
    FROM "notarioElite".pregunta_articulos pa
    JOIN "notarioElite".articulos a ON a.id = pa.articulo_id
    WHERE a.ley_id = 10
  `);
  
  let count = 0;
  const updatedPreguntas = new Set();
  
  for (let r of qRes.rows) {
    if (!updatedPreguntas.has(r.pregunta_id) && r.nodo_id) {
      await c.query('UPDATE "notarioElite".preguntas SET nodo_id = $1 WHERE id = $2', [r.nodo_id, r.pregunta_id]);
      updatedPreguntas.add(r.pregunta_id);
      count++;
    }
  }
  
  console.log(`Updated ${count} questions with a nodo_id.`);
  await c.end();
}
run();
