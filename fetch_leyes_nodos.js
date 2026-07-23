const { Client } = require('pg');
const fs = require('fs');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const leyesResult = await client.query('SELECT id, nombre, porcentaje FROM "notarioElite".leyes WHERE ban_estudiar = true ORDER BY id');
  const nodosResult = await client.query('SELECT id, ley_id, padre_id, nombre, nivel, total_preguntas FROM "notarioElite".nodos ORDER BY ley_id, nivel, id');
  
  const data = {
    leyes: leyesResult.rows,
    nodos: nodosResult.rows
  };
  
  fs.writeFileSync('leyes_nodos_data.json', JSON.stringify(data, null, 2));
  await client.end();
}).catch(err => {
  console.error(err);
  client.end();
});
