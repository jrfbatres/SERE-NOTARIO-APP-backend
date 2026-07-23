const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const insertQuery = `
    INSERT INTO asistente_legal_app."CON_TIPO_DOCUMENTOS" (id_categoria, nombre_tipo)
    VALUES 
      (1, 'Compra Venta de Vehiculo'),
      (1, 'Promesa de Venta de Vehiculo'),
      (1, 'Permiso Salida de Vehiculo'),
      (1, 'Contrato de Arrendamiento de UBER'),
      (1, 'Contrato de Arrendamiento de Vivienda')
    RETURNING *;
  `;
  
  try {
    const res = await client.query(insertQuery);
    console.log('Inserted rows in CON_TIPO_DOCUMENTOS:');
    console.table(res.rows);
  } catch (e) {
    console.error('Error inserting rows:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
