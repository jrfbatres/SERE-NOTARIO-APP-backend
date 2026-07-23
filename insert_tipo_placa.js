const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  try {
    await client.query('BEGIN');
    
    // Shift existing order down to make space at 2
    await client.query(`
      UPDATE asistente_legal_app."CON_TIPO_BIEN_CAMPOS"
      SET orden = orden + 1
      WHERE id_tipo_bien = 1 AND orden >= 2;
    `);
    
    const validacion = 'Debe ser uno de los siguientes: P-PARTICULAR, N-NACIONAL, C-CAMIÓN, M-MOTOCICLETA, CD-CUERPO DIPLOMATICO, CC-CUERPO CONSULAR, MI-MISIÓN INTERNACIONAL, O-OFICIAL, A-ALQUILER, AB-AUTOBUS, MB-MICROBUS, RE-REMOLQUE, CR-CRUZ ROJA, D-DISCAPACITADO, V-VENDEDOR, PR-PROVISIONAL.';
    
    // Insert Tipo de Placa
    await client.query(`
      INSERT INTO asistente_legal_app."CON_TIPO_BIEN_CAMPOS" 
      (id_tipo_bien, nombre_campo, tipo_dato, ancho, es_obligatorio, validacion, orden)
      VALUES 
        (1, 'Tipo de Placa', 'TEXTO', 50, 'N', $1, 2);
    `, [validacion]);
    
    await client.query('COMMIT');
    console.log('Tipo de Placa inserted successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error inserting Tipo de Placa:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
