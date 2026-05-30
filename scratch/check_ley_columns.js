const { query } = require('../src/lib/db');

async function main() {
  const result = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'notarioElite' AND table_name = 'leyes'
  `);
  console.log(result.rows);
}

main().catch(console.error);
