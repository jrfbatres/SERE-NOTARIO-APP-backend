const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres',
});

async function main() {
  try {
    console.log('Creando la tabla wompi_config...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wompi_config (
        id SERIAL PRIMARY KEY,
        app_id VARCHAR(255) NOT NULL,
        api_secret VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla wompi_config lista.');

    // Limpiamos cualquier dato viejo si existiera
    await pool.query('TRUNCATE TABLE wompi_config;');
    
    // Insertamos las nuevas llaves
    console.log('Insertando llaves de Wompi...');
    await pool.query(
      'INSERT INTO wompi_config (app_id, api_secret) VALUES ($1, $2);',
      ['8a70ca74-0915-404b-b5cf-1dc05fd40af8', '62074774-1810-4f5b-90b5-0ca9fe9cdf1d']
    );
    console.log('Valores insertados con éxito.');
    
  } catch (error) {
    console.error('Error configurando la tabla:', error);
  } finally {
    await pool.end();
  }
}

main();
