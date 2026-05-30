const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function main() {
  try {
    const queryStr = `
      SELECT a.id, a.numero, a.contenido
      FROM "notarioElite".articulos a
      JOIN "notarioElite".nodos n ON a.nodo_id = n.id
      WHERE n.ley_id = 9
      ORDER BY CAST(a.numero AS INTEGER) ASC;
    `;
    const res = await pool.query(queryStr);
    
    fs.writeFileSync('scratch/notary_articles_list.json', JSON.stringify(res.rows, null, 2));
    console.log(`Saved ${res.rows.length} articles to scratch/notary_articles_list.json`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
