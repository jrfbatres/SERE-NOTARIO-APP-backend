const { query } = require('../src/lib/db');

async function main() {
  // 1. Add audio_1 and audio_2 columns if they don't exist
  try {
    await query(`
      ALTER TABLE "notarioElite".leyes 
      ADD COLUMN IF NOT EXISTS audio_1 text,
      ADD COLUMN IF NOT EXISTS audio_2 text
    `);
    console.log("Successfully added audio columns to leyes table.");
  } catch (err) {
    console.error("Error adding columns:", err);
  }

  // 2. Query all laws to see what we have
  const result = await query(`
    SELECT id, nombre, audio_1, audio_2 
    FROM "notarioElite".leyes
  `);
  console.log("Current laws in DB:");
  console.log(result.rows);
}

main().catch(console.error);
