const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  try {
    await client.query('BEGIN');
    
    // Add column
    await client.query(`
      ALTER TABLE asistente_legal_app."CON_TIPO_BIEN_CAMPOS"
      ADD COLUMN orden INT;
    `);
    
    // Populate order for existing fields
    const fieldsOrder = [
      'Placa',
      'Número de DUCA',
      'Año',
      'Marca',
      'Modelo',
      'Color',
      'Tipo',
      'Clase',
      'Capacidad',
      'Nº Chasis',
      'Nº Motor',
      'Nº VIN'
    ];
    
    for (let i = 0; i < fieldsOrder.length; i++) {
      await client.query(`
        UPDATE asistente_legal_app."CON_TIPO_BIEN_CAMPOS"
        SET orden = $1
        WHERE nombre_campo = $2;
      `, [i + 1, fieldsOrder[i]]);
    }
    
    await client.query('COMMIT');
    console.log('Column orden added and populated successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error adding orden:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
