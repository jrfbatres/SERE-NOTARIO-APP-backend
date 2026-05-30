const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();

  try {
    const updateQuery = `
      UPDATE "notarioElite".preguntas p
      SET nodo_id = a.nodo_id
      FROM (
        SELECT pa.pregunta_id, MIN(a.nodo_id) as nodo_id
        FROM "notarioElite".pregunta_articulos pa
        JOIN "notarioElite".articulos a ON pa.articulo_id = a.id
        GROUP BY pa.pregunta_id
      ) a
      WHERE p.id = a.pregunta_id
        AND p.ley_id = 3;
    `;
    
    const res = await client.query(updateQuery);
    
    console.log(`Actualización exitosa. Se asociaron o verificaron nodos en ${res.rowCount} preguntas.`);
  } catch (error) {
    console.error('Error durante la actualización:', error);
  } finally {
    await client.end();
  }
}

run();
