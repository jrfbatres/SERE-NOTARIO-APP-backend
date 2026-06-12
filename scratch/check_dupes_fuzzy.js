const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT pregunta_id, texto_opcion FROM "notarioElite".opciones');
    
    // Custom fuzzy matching to catch duplicates with slight differences
    const fuzzyNormalize = (str) => {
      if (!str) return '';
      let s = str.toLowerCase();
      // Remove all non-alphanumeric chars to catch spacing/punctuation differences
      s = s.replace(/[^a-z0-9áéíóúüñ]/gi, '');
      return s;
    };

    const grouped = {};
    for (const row of res.rows) {
      if (!grouped[row.pregunta_id]) grouped[row.pregunta_id] = [];
      grouped[row.pregunta_id].push(row);
    }

    let dupesCount = 0;
    const examples = [];

    for (const [pId, opts] of Object.entries(grouped)) {
      const seen = new Set();
      let hasDupe = false;
      for (const opt of opts) {
        const norm = fuzzyNormalize(opt.texto_opcion);
        if (norm === '') continue; // ignore completely empty

        if (seen.has(norm)) {
          dupesCount++;
          hasDupe = true;
        } else {
          seen.add(norm);
        }
      }
      if (hasDupe && examples.length < 5) {
        examples.push(opts.map(o => o.texto_opcion));
      }
    }

    console.log(`Fuzzy duplicates found: ${dupesCount}`);
    if (examples.length > 0) {
      console.log("Examples:");
      examples.forEach((ex, i) => console.log(`Example ${i+1}:`, ex));
    }
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
