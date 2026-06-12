const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, pregunta_id, texto_opcion, es_correcta, orden FROM "notarioElite".opciones ORDER BY pregunta_id, es_correcta DESC, id ASC');
    let deletedCount = 0;

    const normalize = (val) => {
      if (!val) return '';
      let text = val.trim().toLowerCase();
      // Remove leading letters like "a)", "b)", "a."
      text = text.replace(/^[a-e]\s*[\.\)]\s*/, '');
      return text;
    };

    const grouped = {};
    for (const row of res.rows) {
      if (!grouped[row.pregunta_id]) {
        grouped[row.pregunta_id] = [];
      }
      grouped[row.pregunta_id].push(row);
    }

    const idsToDelete = [];

    for (const [preguntaId, options] of Object.entries(grouped)) {
      const seenTexts = new Set();

      for (const opt of options) {
        const norm = normalize(opt.texto_opcion);
        if (seenTexts.has(norm)) {
          // duplicate found
          idsToDelete.push(opt.id);
        } else {
          seenTexts.add(norm);
        }
      }
    }

    if (idsToDelete.length > 0) {
      // Delete in batches to avoid query size limits if it's too big
      const batchSize = 100;
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(',');
        await client.query(`DELETE FROM "notarioElite".opciones WHERE id IN (${placeholders})`, batch);
      }
      deletedCount = idsToDelete.length;
    }

    console.log(`Se eliminaron ${deletedCount} opciones duplicadas.`);
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
