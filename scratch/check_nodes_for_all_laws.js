const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
client.connect().then(async () => {
  const res = await client.query(`
    SELECT ley_id, COUNT(*) as cnt, COUNT(concepto) as con_concepto, COUNT(analisis_jurisconsulto) as con_analisis, COUNT(tips_didacticos) as con_tips
    FROM "notarioElite".nodos
    GROUP BY ley_id
    ORDER BY ley_id ASC
  `);
  console.log('Nodes count and populated fields by ley_id:', res.rows);
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
