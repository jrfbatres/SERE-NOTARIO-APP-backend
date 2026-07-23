const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  const insertQuery = `
    INSERT INTO asistente_legal_app."CON_TIPO_BIEN_CAMPOS" 
    (id_tipo_bien, nombre_campo, tipo_dato, ancho, es_obligatorio, validacion)
    VALUES 
      (1, 'Placa', 'TEXTO', 15, 'S', 'Validar que sea formato de placa de El Salvador (ej. P123456 o P123456-2016).'),
      (1, 'Año', 'NUMERICO', 4, 'S', 'Validar que sea un año numérico de 4 dígitos.'),
      (1, 'Marca', 'TEXTO', 50, 'S', 'Extraer la marca del vehículo como texto.'),
      (1, 'Modelo', 'TEXTO', 50, 'S', 'Extraer el modelo del vehículo como texto.'),
      (1, 'Capacidad', 'TEXTO', 20, 'S', 'Extraer la capacidad (ej. 5.00ASS, 1.00TON).'),
      (1, 'Tipo', 'TEXTO', 30, 'S', 'Clasificación de tipo (ej. SEDAN, PICK UP).'),
      (1, 'Clase', 'TEXTO', 30, 'S', 'Clasificación de clase (ej. AUTOMOVIL).'),
      (1, 'Color', 'TEXTO', 50, 'S', 'Color o colores descriptivos del vehículo.'),
      (1, 'Nº Chasis', 'TEXTO', 30, 'S', 'Número de chasis (alfanumérico).'),
      (1, 'Nº Motor', 'TEXTO', 30, 'S', 'Número de motor (alfanumérico).'),
      (1, 'Nº VIN', 'TEXTO', 30, 'S', 'Número VIN (alfanumérico).')
    RETURNING *;
  `;
  
  try {
    const res = await client.query(insertQuery);
    console.log('Inserted fields for Vehículo successfully.');
  } catch (e) {
    console.error('Error inserting fields:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
