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

  const updateQuery = `
    UPDATE asistente_legal_app."CON_ENTIDAD_CAMPOS" 
    SET observaciones = 'TEXTO (S/N). Indica si la persona sabe firmar. Default: S'
    WHERE id_entidad = $1 AND nombre_campo = 'sabe_firmar'
  `;

  await client.query(updateQuery, [idNatural]);
  console.log('sabe_firmar updated successfully to TEXTO (S/N) with Default: S');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
