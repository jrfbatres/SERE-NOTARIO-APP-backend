const { Client } = require('pg');
const fs = require('fs');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  let md = '# Schema: notarioElite\n\n';
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'notarioElite'");
  for (const row of tables.rows) {
    const table = row.table_name;
    md += `## Table: ${table}\n`;
    md += '| Column Name | Data Type | Max Length | Nullable |\n';
    md += '|---|---|---|---|\n';
    const cols = await client.query("SELECT column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns WHERE table_schema = 'notarioElite' AND table_name = $1 ORDER BY ordinal_position", [table]);
    for (const col of cols.rows) {
      md += `| ${col.column_name} | ${col.data_type} | ${col.character_maximum_length || 'null'} | ${col.is_nullable} |\n`;
    }
    md += '\n';
  }
  fs.writeFileSync('schema_notarioElite.md', md);
  await client.end();
});
