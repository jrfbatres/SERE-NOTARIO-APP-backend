const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres',
});

async function main() {
  try {
    console.log('Agregando columnas a la tabla wompi_config...');
    await pool.query(`
      ALTER TABLE wompi_config 
      ADD COLUMN IF NOT EXISTS url_serenotario VARCHAR(255),
      ADD COLUMN IF NOT EXISTS url_webhook VARCHAR(255);
    `);
    console.log('Columnas url_serenotario y url_webhook agregadas con éxito.');
    
  } catch (error) {
    console.error('Error alterando la tabla:', error);
  } finally {
    await pool.end();
  }
}

main();
