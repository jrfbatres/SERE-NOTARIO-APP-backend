const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  
  const aRes = await c.query('SELECT id, numero FROM "notarioElite".articulos WHERE ley_id = 10');
  const articulosMap = new Map();
  for (let a of aRes.rows) {
    articulosMap.set(a.numero.toLowerCase(), a.id);
  }
  
  const qRes = await c.query('SELECT id, articulo FROM "notarioElite".preguntas WHERE ley_id = 10');
  const preguntas = qRes.rows;
  
  let count = 0;
  for (let p of preguntas) {
    if (!p.articulo) continue;
    
    const regex = /(\d+(?:-[A-Za-z]+)?)/g;
    let match;
    const nums = [];
    while ((match = regex.exec(p.articulo)) !== null) {
      nums.push(match[1].toLowerCase());
    }
    
    for (let num of nums) {
      const artId = articulosMap.get(num);
      if (artId) {
        // First check if exists
        const exRes = await c.query('SELECT 1 FROM "notarioElite".pregunta_articulos WHERE pregunta_id=$1 AND articulo_id=$2', [p.id, artId]);
        if (exRes.rows.length === 0) {
          await c.query(`
            INSERT INTO "notarioElite".pregunta_articulos (pregunta_id, articulo_id)
            VALUES ($1, $2)
          `, [p.id, artId]);
          count++;
        }
      }
    }
  }
  
  console.log(`Poblados exitosamente ${count} registros en pregunta_articulos.`);
  await c.end();
}
run();
