const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
client.connect().then(async () => {
  // Count nodes that have data in each of these columns
  const resCounts = await client.query(`
    SELECT 
      COUNT(*) as total_nodos,
      COUNT(concepto) as con_concepto,
      COUNT(analisis_jurisconsulto) as con_analisis,
      COUNT(tips_didacticos) as con_tips
    FROM "notarioElite".nodos
  `);
  console.log('Counts of populated fields:', resCounts.rows[0]);

  // Show a few rows that have at least one populated field
  const resSample = await client.query(`
    SELECT id, nombre, ley_id, concepto, analisis_jurisconsulto, tips_didacticos
    FROM "notarioElite".nodos
    WHERE concepto IS NOT NULL OR analisis_jurisconsulto IS NOT NULL OR tips_didacticos IS NOT NULL
    LIMIT 5
  `);
  console.log('Sample populated nodes:', resSample.rows);

  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
