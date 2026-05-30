const { query } = require('../src/lib/db');

async function main() {
  const updateRes = await query(`
    UPDATE "notarioElite".leyes 
    SET 
      audio_1 = 'El_Código_Civil_salvadoreño_de_1859.m4a',
      audio_2 = 'Tesoros_y_resucitados_del_Código_Civil_salvadoreño.m4a'
    WHERE id = 1
  `);
  console.log("Update result:", updateRes.rowCount);

  const checkRes = await query(`
    SELECT id, nombre, audio_1, audio_2 
    FROM "notarioElite".leyes 
    WHERE id = 1
  `);
  console.log("Updated Ley:", checkRes.rows[0]);
}

main().catch(console.error);
