const { query } = require('../src/lib/db');

async function main() {
  const updateRes = await query(`
    UPDATE "notarioElite".leyes 
    SET audio_1 = 'La_fe_pública_del_notariado_salvadoreño.m4a' 
    WHERE id = 9
  `);
  console.log("Update result:", updateRes.rowCount);

  const checkRes = await query(`
    SELECT id, nombre, audio_1, audio_2 
    FROM "notarioElite".leyes 
    WHERE id = 9
  `);
  console.log("Updated Ley:", checkRes.rows[0]);
}

main().catch(console.error);
