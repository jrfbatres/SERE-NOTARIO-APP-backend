const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function deleteNodosAndArticles() {
  const leyId = 3;
  try {
    console.log(`Borrando todos los artículos y nodos para ley_id = ${leyId}...`);
    
    // Primero borramos los artículos asociados a los nodos de esta ley
    const resArticulos = await pool.query(`
      DELETE FROM "notarioElite".articulos 
      WHERE nodo_id IN (SELECT id FROM "notarioElite".nodos WHERE ley_id = $1)
    `, [leyId]);
    console.log(`Se han borrado ${resArticulos.rowCount} artículos.`);

    // Luego borramos los nodos
    const resNodos = await pool.query(`DELETE FROM "notarioElite".nodos WHERE ley_id = $1`, [leyId]);
    console.log(`Se han borrado ${resNodos.rowCount} nodos exitosamente.`);
    
  } catch (err) {
    console.error('Error al borrar:', err.message);
  } finally {
    pool.end();
  }
}

deleteNodosAndArticles();
