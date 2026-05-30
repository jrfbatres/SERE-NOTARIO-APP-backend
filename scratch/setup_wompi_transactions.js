const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres',
});

async function main() {
  try {
    console.log('Creando tabla wompi_transactions...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wompi_transactions (
        id SERIAL PRIMARY KEY,
        id_transaccion VARCHAR(255) NOT NULL,
        identificador_enlace_comercio VARCHAR(255),
        monto DECIMAL(10, 2),
        resultado_transaccion VARCHAR(100),
        es_productiva BOOLEAN,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla wompi_transactions lista.');
  } catch (error) {
    console.error('Error creando la tabla:', error);
  } finally {
    await pool.end();
  }
}

main();
