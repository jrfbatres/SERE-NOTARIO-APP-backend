const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function main() {
  await client.connect();

  const statsRes = await client.query(`
    SELECT 
      ley_id,
      COUNT(*) as total_questions
    FROM "notarioElite".preguntas
    GROUP BY ley_id
    ORDER BY ley_id
  `);
  console.log("Questions per ley_id in the database:");
  console.table(statsRes.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
