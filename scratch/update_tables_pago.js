const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres',
});

async function main() {
  try {
    console.log('Alterando tabla usuarios y creando usuario_pagos...');
    
    await pool.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS ban_nodos_libres VARCHAR(1) DEFAULT 'N';
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuario_pagos (
        id SERIAL PRIMARY KEY,
        usuario_id UUID NOT NULL,
        identificador_enlace VARCHAR(255),
        url_enlace VARCHAR(1000),
        monto DECIMAL(10, 2),
        nombre_producto VARCHAR(255),
        meses_duracion INT,
        estado VARCHAR(50) DEFAULT 'PENDIENTE',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_pago TIMESTAMP,
        fecha_vencimiento TIMESTAMP
      );
    `);

    console.log('Tablas actualizadas con éxito.');
  } catch (error) {
    console.error('Error alterando la tabla:', error);
  } finally {
    await pool.end();
  }
}

main();
