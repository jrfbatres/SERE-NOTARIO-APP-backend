const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();
  
  // 1. Cuidado personal y convivencia -> Art. 210
  await client.query('UPDATE "notarioElite".articulos SET nodo_id = $1 WHERE numero = $2 AND ley_id = 3', ['ley3_cuidado_personal_y_convivencia_2489', '210']);
  
  // 2. Representación legal -> Art. 206
  await client.query('UPDATE "notarioElite".articulos SET nodo_id = $1 WHERE numero = $2 AND ley_id = 3', ['ley3_representacion_legal_1070', '206']);
  
  // 3. Salud individual y base genética -> Art. 204
  await client.query('UPDATE "notarioElite".articulos SET nodo_id = $1 WHERE numero = $2 AND ley_id = 3', ['ley3_salud_individual_y_base_genetica_5211', '204']);
  
  // 4. Sujetos -> Art. 257
  await client.query('UPDATE "notarioElite".articulos SET nodo_id = $1 WHERE numero = $2 AND ley_id = 3', ['ley3_sujetos_2991', '257']);
  
  console.log('Articulos reasignados correctamente a los 4 nodos hijos.');
  await client.end();
}
run();
