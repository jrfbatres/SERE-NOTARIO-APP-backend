const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  // Find Pais
  const paises = await client.query(`SELECT * FROM asistente_legal_app."CON_Pais" WHERE nombre ILIKE '%El Salvador%' OR id_pais = 'SV'`);
  console.log('Paises:', paises.rows);

  // Find Departamento
  const depto = await client.query(`SELECT * FROM asistente_legal_app."CON_Departamento" WHERE nombre ILIKE '%San Salvador%'`);
  console.log('Departamentos:', depto.rows);

  // Find Municipio/Distrito
  const muni = await client.query(`SELECT * FROM asistente_legal_app."CON_Municipio" WHERE nombre ILIKE '%San Salvador%'`);
  console.log('Municipios:', muni.rows);
  
  const dist = await client.query(`SELECT * FROM asistente_legal_app."CON_Distrito" WHERE nombre ILIKE '%San Salvador%'`);
  console.log('Distritos:', dist.rows);

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
