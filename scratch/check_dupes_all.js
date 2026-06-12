const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function run() {
  const client = await pool.connect();
  try {
    for (const schema of ['public', '"notarioElite"']) {
      const res = await client.query(`SELECT pregunta_id, texto_opcion FROM ${schema}.opciones`);
      
      const fuzzyNormalize = (str) => {
        if (!str) return '';
        let s = str.toLowerCase();
        s = s.replace(/[^a-z0-9áéíóúüñ]/gi, '');
        return s;
      };

      const grouped = {};
      for (const row of res.rows) {
        if (!grouped[row.pregunta_id]) grouped[row.pregunta_id] = [];
        grouped[row.pregunta_id].push(row);
      }

      let dupesCount = 0;
      for (const [pId, opts] of Object.entries(grouped)) {
        const seen = new Set();
        for (const opt of opts) {
          const norm = fuzzyNormalize(opt.texto_opcion);
          if (norm === '') continue;
          if (seen.has(norm)) {
            dupesCount++;
          } else {
            seen.add(norm);
          }
        }
      }

      console.log(`Fuzzy duplicates found in ${schema}.opciones: ${dupesCount}`);
    }
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
