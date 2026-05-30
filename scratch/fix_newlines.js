const { Client } = require('pg');

const DB_CONFIG = { connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' };

async function run() {
  console.log("--- CORRIGIENDO SALTOS DE LÍNEA EN ARTÍCULOS ---");
  const dbClient = new Client(DB_CONFIG);
  await dbClient.connect();

  try {
    const res = await dbClient.query('SELECT id, contenido FROM "notarioElite".articulos');
    const articulos = res.rows;
    let updatedCount = 0;

    for (const art of articulos) {
      if (!art.contenido) continue;

      // Reemplazamos los saltos de línea (\r\n o \n) que NO estén precedidos por un punto (.) o punto y coma (;)
      // La expresión regular usa negative lookbehind para buscar saltos de línea.
      // (?<![\.;]) significa "que no esté precedido por . o ;"
      // Capturamos cualquier espacio alrededor del salto de línea para reemplazar todo por un solo espacio.
      let nuevoContenido = art.contenido.replace(/(?<![\.;])\s*\r?\n\s*/g, ' ');

      if (nuevoContenido !== art.contenido) {
        await dbClient.query(
          'UPDATE "notarioElite".articulos SET contenido = $1 WHERE id = $2',
          [nuevoContenido, art.id]
        );
        updatedCount++;
      }
    }

    console.log(`\n¡Listo! Se corrigieron los saltos de línea en ${updatedCount} artículos.`);

  } catch (err) {
    console.error("Error global:", err);
  } finally {
    await dbClient.end();
  }
}

run();
