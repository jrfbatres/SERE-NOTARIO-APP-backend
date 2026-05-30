const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function check() {
  try {
    const leyesRes = await pool.query(`SELECT id, nombre FROM "notarioElite".leyes WHERE nombre ILIKE '%familia%'`);
    console.log('Leyes encontradas:', leyesRes.rows);
    
    if (leyesRes.rows.length > 0) {
      const leyId = 3; // Código de Familia
      const nodosSinArticulos = await pool.query(`
        SELECT n.id, n.nombre, n.nivel 
        FROM "notarioElite".nodos n
        LEFT JOIN "notarioElite".articulos a ON n.id = a.nodo_id
        WHERE n.ley_id = $1 AND a.id IS NULL
        ORDER BY n.id ASC
        LIMIT 20
      `, [leyId]);
      
      console.log('Nodos hijos sin artículos (muestra de 20):');
      console.table(nodosSinArticulos.rows);
      
      const counts = await pool.query(`
        SELECT n.nivel, COUNT(*) as count 
        FROM "notarioElite".nodos n
        LEFT JOIN "notarioElite".articulos a ON n.id = a.nodo_id
        WHERE n.ley_id = $1 AND a.id IS NULL
        GROUP BY n.nivel
      `, [leyId]);
      
      console.log('Conteos por nivel de nodos sin artículos:');
      console.table(counts.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
