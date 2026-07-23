const { Client } = require('pg');

async function main() {
  const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await c.connect();
  
  try {
    await c.query('BEGIN');
    
    // 1. Get IDs
    const resPro = await c.query(`SELECT id FROM "notarioElite".pensum WHERE nombre = 'Profundo'`);
    const proId = resPro.rows[0].id;
    
    const resMag = await c.query(`SELECT id FROM "notarioElite".pensum WHERE nombre = 'Magistral'`);
    const magId = resMag.rows[0].id;
    
    // 2. Fix the pensum
    await c.query(`UPDATE "notarioElite".pensum SET dias_totales = 60, descripcion = 'Plan experto de 60 días con carga doble' WHERE id = $1`, [magId]);
    
    // 3. Clear out the wrong 30-day distribution
    await c.query(`DELETE FROM "notarioElite".pensum_dia WHERE pensum_id = $1`, [magId]);
    
    // 4. Copy from Profundo, but multiply cantidad_preguntas by 2
    await c.query(`
      INSERT INTO "notarioElite".pensum_dia (pensum_id, dia, ley_id, nodo_id, cantidad_preguntas)
      SELECT $1, dia, ley_id, nodo_id, cantidad_preguntas * 2
      FROM "notarioElite".pensum_dia
      WHERE pensum_id = $2
    `, [magId, proId]);
    
    await c.query('COMMIT');
    console.log('Fixed Magistral successfully!');
  } catch (err) {
    await c.query('ROLLBACK');
    console.error(err);
  } finally {
    await c.end();
  }
}
main();
