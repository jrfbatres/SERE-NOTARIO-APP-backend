const { query } = require('../src/lib/db');

async function main() {
  // 1. Add video_1 and video_2 columns if they don't exist
  try {
    await query(`
      ALTER TABLE "notarioElite".leyes 
      ADD COLUMN IF NOT EXISTS video_1 text,
      ADD COLUMN IF NOT EXISTS video_2 text
    `);
    console.log("Successfully added video columns to leyes table.");
  } catch (err) {
    console.error("Error adding columns:", err);
  }

  // 2. Update Código Civil (id: 1)
  const updateRes = await query(`
    UPDATE "notarioElite".leyes 
    SET video_1 = 'Código_Civil_de_1860.mp4' 
    WHERE id = 1
  `);
  console.log("Update result:", updateRes.rowCount);

  // 3. Query law to see what we have
  const result = await query(`
    SELECT id, nombre, audio_1, audio_2, video_1, video_2 
    FROM "notarioElite".leyes
    WHERE id = 1
  `);
  console.log("Updated Ley:", result.rows[0]);
}

main().catch(console.error);
