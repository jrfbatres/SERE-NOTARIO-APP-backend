const { Client } = require('pg');

async function main() {
  const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await c.connect();
  
  try {
    await c.query('BEGIN');
    
    // Add column if it doesn't exist
    await c.query(`
      ALTER TABLE "notarioElite".pensum 
      ADD COLUMN IF NOT EXISTS ban_plan VARCHAR(10)
    `);
    
    // Map values: 
    // Lite -> Básico ('B')
    // Profundo -> Premium ('P')
    // Magistral -> Magistral ('M')
    
    await c.query(`UPDATE "notarioElite".pensum SET ban_plan = 'B' WHERE nombre LIKE '%Lite%'`);
    await c.query(`UPDATE "notarioElite".pensum SET ban_plan = 'P' WHERE nombre = 'Profundo'`);
    await c.query(`UPDATE "notarioElite".pensum SET ban_plan = 'M' WHERE nombre = 'Magistral'`);
    
    await c.query('COMMIT');
    console.log('Column ban_plan added and populated in pensum table successfully!');
  } catch (err) {
    await c.query('ROLLBACK');
    console.error(err);
  } finally {
    await c.end();
  }
}
main();
