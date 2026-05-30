const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
client.connect().then(async () => {
  // Let's test for 'ln_inhabilitacion' or 'ln_idioma_castellano'
  const testNodeId = 'ln_idioma_castellano';
  const res = await client.query(`
    SELECT DISTINCT a.id, a.numero, a.tema AS titulo, a.contenido
    FROM "notarioElite".articulos a
    JOIN "notarioElite".pregunta_articulos pa ON a.id = pa.articulo_id
    JOIN "notarioElite".preguntas p ON p.id = pa.pregunta_id
    WHERE p.nodo_id = $1
    ORDER BY a.id ASC
  `, [testNodeId]);
  console.log(`Articles found via questions for node '${testNodeId}':`);
  console.log(res.rows);
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
