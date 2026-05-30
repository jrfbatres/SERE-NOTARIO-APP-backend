const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function inspect() {
  try {
    const res = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COUNT(concepto) as con_concepto, 
        COUNT(analisis_jurisconsulto) as con_analisis 
      FROM "notarioElite".nodos
    `);
    console.log('Estadisticas globales:', res.rows[0]);

    const res2 = await pool.query(`
      SELECT id, nombre, nivel, ley_id 
      FROM "notarioElite".nodos 
      WHERE (concepto IS NULL OR concepto = '') 
         OR (analisis_jurisconsulto IS NULL OR analisis_jurisconsulto = '')
      LIMIT 10
    `);
    console.log('Ejemplos vacios:', res2.rows);

    const res3 = await pool.query(`
      SELECT ley_id, COUNT(*) as vacios 
      FROM "notarioElite".nodos 
      WHERE (concepto IS NULL OR concepto = '') 
         OR (analisis_jurisconsulto IS NULL OR analisis_jurisconsulto = '')
      GROUP BY ley_id
      ORDER BY vacios DESC
    `);
    console.log('Vacios por Ley:', res3.rows);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

inspect();
