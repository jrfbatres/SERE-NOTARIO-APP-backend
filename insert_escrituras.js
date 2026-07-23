const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const insertQuery = `
    INSERT INTO asistente_legal_app."CON_TIPO_DOCUMENTOS" (id_categoria, nombre_tipo)
    VALUES 
      (2, 'Compra Venta de Vivienda'),
      (2, 'Poder General Judicial'),
      (2, 'Poder General Administrativo'),
      (2, 'Poder General Judicial y Administrativo'),
      (2, 'Poder Especial'),
      (2, 'Poder Especial con Cláusulas Especiales'),
      (2, 'Poder General Judicial con Cláusulas Especiales'),
      (2, 'Poder General Administrativo con Cláusulas Especiales'),
      (2, 'Poder Especial para contraer Matrimonio'),
      (2, 'Poder Especial para Divorcio'),
      (2, 'Sustitución de Poder'),
      (2, 'Revocatoria de Poder')
    RETURNING *;
  `;
  
  try {
    const res = await client.query(insertQuery);
    console.log('Inserted rows in CON_TIPO_DOCUMENTOS for Escritura Pública:');
    console.table(res.rows);
  } catch (e) {
    console.error('Error inserting rows:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
