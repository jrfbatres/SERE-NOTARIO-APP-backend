const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  try {
    await client.query('BEGIN');
    
    // Update CON_CATEGORIA_DOCUMENTOS
    await client.query(`
      UPDATE asistente_legal_app."CON_CATEGORIA_DOCUMENTOS"
      SET nombre_categoria = 'Escritura Pública'
      WHERE nombre_categoria = 'Escritura Publica';
    `);
    
    // Update CON_TIPO_DOCUMENTOS
    await client.query(`
      UPDATE asistente_legal_app."CON_TIPO_DOCUMENTOS"
      SET nombre_tipo = 'Compra Venta de Vehículo'
      WHERE nombre_tipo = 'Compra Venta de Vehiculo';
    `);
    
    await client.query(`
      UPDATE asistente_legal_app."CON_TIPO_DOCUMENTOS"
      SET nombre_tipo = 'Promesa de Venta de Vehículo'
      WHERE nombre_tipo = 'Promesa de Venta de Vehiculo';
    `);
    
    await client.query(`
      UPDATE asistente_legal_app."CON_TIPO_DOCUMENTOS"
      SET nombre_tipo = 'Permiso Salida de Vehículo'
      WHERE nombre_tipo = 'Permiso Salida de Vehiculo';
    `);
    
    await client.query('COMMIT');
    console.log('Spelling corrected successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error correcting spelling:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
