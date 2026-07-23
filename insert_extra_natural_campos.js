const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  // Find ID for 'Natural' entity
  const resEntidad = await client.query(`SELECT id_entidad FROM asistente_legal_app."CON_ENTIDADES" WHERE nombre_entidad = 'Natural' LIMIT 1`);
  if (resEntidad.rows.length === 0) {
    console.error('Entity Natural not found.');
    await client.end();
    return;
  }
  const idNatural = resEntidad.rows[0].id_entidad;

  const camposExtraNatural = [
    { nombre: 'conocido_por', obligatorio: 'No', obs: 'VARCHAR(200). Conocido por (otros nombres)' },
    { nombre: 'sabe_firmar', obligatorio: 'Sí', obs: 'BOOLEAN. Indica si la persona sabe firmar' }
  ];

  const insertCampoQuery = `
    INSERT INTO asistente_legal_app."CON_ENTIDAD_CAMPOS" 
    (id_entidad, nombre_campo, es_obligatorio, observaciones) 
    VALUES ($1, $2, $3, $4)
  `;

  for (const c of camposExtraNatural) {
    await client.query(insertCampoQuery, [idNatural, c.nombre, c.obligatorio, c.obs]);
  }
  
  console.log('Extra fields for Natural inserted successfully.');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
