const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, opcion_a, opcion_b, opcion_c, opcion_d, opcion_e, respuesta_correcta FROM preguntas');
    let updatedCount = 0;

    for (const row of res.rows) {
      const options = {
        A: row.opcion_a,
        B: row.opcion_b,
        C: row.opcion_c,
        D: row.opcion_d,
        E: row.opcion_e
      };

      const correctLabel = row.respuesta_correcta; // e.g., 'A', 'B', etc.
      
      let changed = false;
      let newOptions = { ...options };

      // Helper to normalize and remove a,b,c prefixes if any
      const normalize = (val) => {
        if (!val) return null;
        let text = val.trim().toLowerCase();
        text = text.replace(/^[a-e]\s*[\.\)]\s*/, '');
        return text;
      };

      const seen = new Map(); // normalizedText -> label

      // First, prioritize the correct option so it is never deleted
      if (correctLabel && options[correctLabel]) {
        seen.set(normalize(options[correctLabel]), correctLabel);
      }

      for (const label of ['A', 'B', 'C', 'D', 'E']) {
        const val = options[label];
        if (!val) continue;

        const normVal = normalize(val);
        if (!normVal) continue;

        if (seen.has(normVal)) {
          const existingLabel = seen.get(normVal);
          if (existingLabel !== label) {
            // It's a duplicate! We clear the current label.
            newOptions[label] = null;
            changed = true;
          }
        } else {
          seen.set(normVal, label);
        }
      }

      if (changed) {
        await client.query(
          'UPDATE preguntas SET opcion_a = $1, opcion_b = $2, opcion_c = $3, opcion_d = $4, opcion_e = $5 WHERE id = $6',
          [newOptions.A, newOptions.B, newOptions.C, newOptions.D, newOptions.E, row.id]
        );
        updatedCount++;
      }
    }
    console.log(`Se actualizaron ${updatedCount} preguntas eliminando opciones duplicadas.`);
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(console.error);
