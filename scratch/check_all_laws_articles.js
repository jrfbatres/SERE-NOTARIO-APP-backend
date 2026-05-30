const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function main() {
  try {
    // 1. Get all laws
    const lawsRes = await pool.query('SELECT id, nombre FROM "notarioElite".leyes;');
    console.log('--- LEYES ---');
    console.log(lawsRes.rows);

    // 2. Count articles with/without tema grouped by ley_id
    const statsQuery = `
      SELECT n.ley_id, l.nombre, 
             COUNT(*) as total_articulos,
             SUM(CASE WHEN a.tema IS NULL OR TRIM(a.tema) = '' THEN 1 ELSE 0 END) as sin_tema,
             SUM(CASE WHEN a.tema IS NOT NULL AND TRIM(a.tema) <> '' THEN 1 ELSE 0 END) as con_tema
      FROM "notarioElite".articulos a
      JOIN "notarioElite".nodos n ON a.nodo_id = n.id
      JOIN "notarioElite".leyes l ON n.ley_id = l.id
      GROUP BY n.ley_id, l.nombre;
    `;
    const statsRes = await pool.query(statsQuery);
    console.log('\n--- ESTADISTICAS DE TEMAS POR LEY ---');
    console.log(statsRes.rows);

    // 3. Sample articles from Ley de Notariado (ley_id = 2)
    const sampleQuery = `
      SELECT a.id, a.numero, a.tema, n.nombre as nodo_nombre
      FROM "notarioElite".articulos a
      JOIN "notarioElite".nodos n ON a.nodo_id = n.id
      WHERE n.ley_id = 2
      LIMIT 5;
    `;
    const sampleRes = await pool.query(sampleQuery);
    console.log('\n--- MUESTRA LEY DE NOTARIADO (LEY_ID = 2) ---');
    console.log(sampleRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
