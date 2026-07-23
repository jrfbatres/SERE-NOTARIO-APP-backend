const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const insertQuery = `
    INSERT INTO asistente_legal_app."CON_TIPO_BIEN" (id_pais, nombre_tipo_bien, ban_escritura_publica)
    VALUES 
      ('SV', 'Vehículo', 'N'),
      ('SV', 'Motocicleta', 'N'),
      ('SV', 'Inmueble (Casa/Vivienda)', 'S'),
      ('SV', 'Terreno / Lote', 'S'),
      ('SV', 'Arma de Fuego', 'N')
    RETURNING *;
  `;
  
  try {
    const res = await client.query(insertQuery);
    console.log('Inserted rows in CON_TIPO_BIEN:');
    console.table(res.rows);
  } catch (e) {
    console.error('Error inserting rows:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
