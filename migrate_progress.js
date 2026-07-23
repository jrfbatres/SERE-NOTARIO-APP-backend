const { Client } = require('pg');

async function main() {
  const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await c.connect();

  try {
    console.log('Starting migration of progress to Lite/Express pensum...');

    // Find the pensum ID for Lite / Express
    const pensumRes = await c.query(`SELECT id FROM "notarioElite".pensum WHERE ban_plan = 'B' LIMIT 1`);
    if (pensumRes.rows.length === 0) {
      console.error('Lite / Express pensum not found!');
      return;
    }
    const pensumId = pensumRes.rows[0].id;
    console.log(`Found Lite / Express pensum with ID: ${pensumId}`);

    // Get all user progress from usuario_nodos
    const progressRes = await c.query(`SELECT * FROM "notarioElite".usuario_nodos`);
    console.log(`Found ${progressRes.rows.length} progress rows in usuario_nodos.`);

    let migratedCount = 0;
    for (const row of progressRes.rows) {
      // Find the corresponding pensum_dia entry
      const pdRes = await c.query(
        `SELECT dia, cantidad_preguntas FROM "notarioElite".pensum_dia WHERE pensum_id = $1 AND nodo_id = $2 LIMIT 1`,
        [pensumId, row.nodo_id]
      );

      if (pdRes.rows.length > 0) {
        const pd = pdRes.rows[0];
        const totalBlocks = Math.ceil(pd.cantidad_preguntas / 5);

        // Insert into nodo_dias_usuario
        await c.query(`
          INSERT INTO "notarioElite".nodo_dias_usuario (
            usuario_id, pensum_id, dia, nodo_id, ley_id, 
            bloque_actual, bloques_totales, nota, completado, 
            notas_bloques, fecha_estudio
          ) VALUES (
            $1::uuid, $2, $3, $4, $5, 
            $6, $7, $8, $9, 
            $10, $11
          ) ON CONFLICT (usuario_id, pensum_id, dia, nodo_id) DO UPDATE SET
            bloque_actual = EXCLUDED.bloque_actual,
            bloques_totales = EXCLUDED.bloques_totales,
            nota = EXCLUDED.nota,
            completado = EXCLUDED.completado,
            notas_bloques = EXCLUDED.notas_bloques,
            fecha_estudio = EXCLUDED.fecha_estudio
        `, [
          row.usuario_id, pensumId, pd.dia, row.nodo_id, row.ley_id,
          row.bloque_actual || 1, totalBlocks, row.nota, row.completado || false,
          row.notas_bloques || '{}', row.actualizado_en || new Date()
        ]);
        migratedCount++;
      }
    }

    console.log(`Successfully migrated ${migratedCount} progress rows to nodo_dias_usuario for Lite plan.`);
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await c.end();
  }
}

main();
