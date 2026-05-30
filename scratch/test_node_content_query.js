const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
client.connect().then(async () => {
  try {
    const id = 'cc_sv';
    const nodeQuery = `
      SELECT id, nombre, concepto, analisis_jurisconsulto, tips_didacticos, total_preguntas, porcentaje_preguntas
      FROM "notarioElite".nodos
      WHERE id = $1
    `;
    const nodeResult = await client.query(nodeQuery, [id]);
    console.log('Node:', nodeResult.rows[0]);

    const articlesQuery = `
      SELECT id, numero, titulo, contenido
      FROM "notarioElite".articulos
      WHERE nodo_id = $1
      ORDER BY id ASC
    `;
    const articlesResult = await client.query(articlesQuery, [id]);
    console.log('Articles:', articlesResult.rows.length);
  } catch (err) {
    console.error('Error executing queries:', err);
  }
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
