const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  
  const tRes = await c.query('SELECT COUNT(*) as total FROM "notarioElite".preguntas WHERE ley_id = 10');
  const totalLey = parseInt(tRes.rows[0].total) || 1;

  const nRes = await c.query('SELECT id, padre_id FROM "notarioElite".nodos WHERE ley_id = 10');
  const nodos = nRes.rows;

  const qRes = await c.query('SELECT nodo_id, COUNT(*) as count FROM "notarioElite".preguntas WHERE ley_id = 10 AND nodo_id IS NOT NULL GROUP BY nodo_id');
  const directCounts = {};
  for (let r of qRes.rows) directCounts[r.nodo_id] = parseInt(r.count);

  const children = {};
  for (let n of nodos) {
    const pId = n.padre_id || 'root';
    if (!children[pId]) children[pId] = [];
    children[pId].push(n.id);
  }

  const totalCounts = {};
  function getCount(id) {
    if (totalCounts[id] !== undefined) return totalCounts[id];
    let sum = directCounts[id] || 0;
    if (children[id]) {
      for (let childId of children[id]) {
        sum += getCount(childId);
      }
    }
    totalCounts[id] = sum;
    return sum;
  }

  for (let n of nodos) {
    getCount(n.id);
  }

  for (let n of nodos) {
    const total = totalCounts[n.id] || 0;
    const pct = ((total / totalLey) * 100).toFixed(2);
    await c.query('UPDATE "notarioElite".nodos SET total_preguntas = $1, porcentaje_preguntas = $2 WHERE id = $3', [total, pct, n.id]);
  }

  console.log(`Actualizados ${nodos.length} nodos con sus totales y porcentajes recursivos. (Total Ley: ${totalLey})`);
  await c.end();
}
run();
