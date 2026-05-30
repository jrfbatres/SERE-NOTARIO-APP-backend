const { query } = require('../src/lib/db');

async function main() {
  const result = await query(`
    SELECT id, nombre, audio_1, audio_2 
    FROM "notarioElite".leyes 
    WHERE nombre ILIKE '%Civil%'
  `);
  console.log("Matching laws:", result.rows);
}

main().catch(console.error);
