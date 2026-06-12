const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT pregunta_id, LOWER(TRIM(texto_opcion)) as txt, COUNT(*) 
      FROM "notarioElite".opciones 
      GROUP BY pregunta_id, txt 
      HAVING COUNT(*) > 1
    `);
    console.log(`Questions with exact duplicates: ${res.rows.length}`);
    if (res.rows.length > 0) {
      console.log('Sample duplicates:', res.rows.slice(0, 5));
    }

    // Now try stripping letters a), b)
    const allRes = await client.query('SELECT pregunta_id, texto_opcion FROM "notarioElite".opciones');
    let dupesWithLetters = 0;
    const normalize = (val) => {
      if (!val) return '';
      let text = val.trim().toLowerCase();
      text = text.replace(/^[a-e]\s*[\.\)]\s*/, '');
      return text;
    };

    const grouped = {};
    for (const row of allRes.rows) {
      if (!grouped[row.pregunta_id]) grouped[row.pregunta_id] = [];
      grouped[row.pregunta_id].push(row);
    }

    for (const [pId, opts] of Object.entries(grouped)) {
      const seen = new Set();
      for (const opt of opts) {
        const norm = normalize(opt.texto_opcion);
        if (seen.has(norm)) {
          dupesWithLetters++;
        } else {
          seen.add(norm);
        }
      }
    }
    console.log(`Duplicates after stripping a), b): ${dupesWithLetters}`);

  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
