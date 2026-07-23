const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  try {
    await client.query('BEGIN');
    
    // 1. Update Placa to not mandatory, and add constraint logic to its validation
    await client.query(`
      UPDATE asistente_legal_app."CON_TIPO_BIEN_CAMPOS"
      SET 
        es_obligatorio = 'N',
        validacion = 'Actúa como llave primaria. Debe estar poblado si el Número de DUCA está vacío. Formato placa El Salvador (ej. P123456).'
      WHERE nombre_campo = 'Placa' AND id_tipo_bien = 1;
    `);
    
    // 2. Insert DUCA field
    await client.query(`
      INSERT INTO asistente_legal_app."CON_TIPO_BIEN_CAMPOS" 
      (id_tipo_bien, nombre_campo, tipo_dato, ancho, es_obligatorio, validacion)
      VALUES 
        (1, 'Número de DUCA', 'TEXTO', 30, 'N', 'Actúa como llave primaria si el vehículo no tiene placa. Debe estar poblado si Placa está vacío.');
    `);
    
    await client.query('COMMIT');
    console.log('Fields updated successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error updating fields:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
