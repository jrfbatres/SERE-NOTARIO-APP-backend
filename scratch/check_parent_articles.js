const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();
  const emptyNodes = [
    'ley3_cuidado_personal_y_convivencia_2489', 
    'ley3_representacion_legal_1070', 
    'ley3_salud_individual_y_base_genetica_5211', 
    'ley3_sujetos_2991'
  ];
  
  for (const n of emptyNodes) {
    const resNode = await client.query('SELECT nombre, padre_id FROM "notarioElite".nodos WHERE id = $1', [n]);
    if (resNode.rows.length) {
      const node = resNode.rows[0];
      const resParent = await client.query('SELECT nombre FROM "notarioElite".nodos WHERE id = $1', [node.padre_id]);
      const parentName = resParent.rows.length ? resParent.rows[0].nombre : 'Unknown';
      const resArts = await client.query('SELECT id, numero, tema FROM "notarioElite".articulos WHERE nodo_id = $1 ORDER BY numero::int ASC', [node.padre_id]);
      
      console.log('Empty Child:', node.nombre, '-> Parent:', parentName);
      console.log('  Parent Articles:');
      resArts.rows.forEach(a => console.log(`    Art. ${a.numero} (${a.tema}) - ID: ${a.id}`));
    }
  }
  await client.end();
}
run();
