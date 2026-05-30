const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await client.connect();

  try {
    await client.query('BEGIN');

    // Fetch all questions for ley_id = 3 in notarioElite
    const resPreguntas = await client.query('SELECT id, articulo FROM "notarioElite".preguntas WHERE ley_id = 3');
    const preguntas = resPreguntas.rows;
    
    // Fetch all articles for ley_id = 3 to map numero -> articulo_id
    const resArticulos = await client.query('SELECT id, numero FROM "notarioElite".articulos WHERE ley_id = 3');
    const articuloMap = {};
    for (const art of resArticulos.rows) {
      articuloMap[art.numero] = art.id; // Map string/number '30' to database integer ID
    }

    let insertedCount = 0;

    for (const p of preguntas) {
      if (!p.articulo) continue;

      // Parse the 'articulo' field for numbers. e.g. "Art. 30", "12, 13, 14", "Artículos 45 y 46"
      // Match all sequences of digits
      const matches = String(p.articulo).match(/\d+/g);
      
      if (matches && matches.length > 0) {
        // Find unique numbers
        const uniqueNumbers = [...new Set(matches)];
        
        for (const num of uniqueNumbers) {
          const articulo_id = articuloMap[num];
          if (articulo_id) {
            // Check if it already exists just in case
            const resCheck = await client.query(
              'SELECT 1 FROM "notarioElite".pregunta_articulos WHERE pregunta_id = $1 AND articulo_id = $2',
              [p.id, articulo_id]
            );
            
            if (resCheck.rows.length === 0) {
              await client.query(
                'INSERT INTO "notarioElite".pregunta_articulos (pregunta_id, articulo_id) VALUES ($1, $2)',
                [p.id, articulo_id]
              );
              insertedCount++;
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Migración exitosa. Se insertaron ${insertedCount} relaciones en pregunta_articulos.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración:', error);
  } finally {
    await client.end();
  }
}

run();
