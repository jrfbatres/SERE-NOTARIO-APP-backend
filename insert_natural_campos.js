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

  const camposNatural = [
    { nombre: 'nombre_completo', obligatorio: 'Sí', obs: 'VARCHAR(200). Nombre completo según DUI' },
    { nombre: 'dui', obligatorio: 'Sí', obs: 'VARCHAR(10). Formato 00000000-0' },
    { nombre: 'nit', obligatorio: 'No', obs: 'VARCHAR(17). Si posee NIT' },
    { nombre: 'fecha_nacimiento', obligatorio: 'No', obs: 'DATE.' },
    { nombre: 'estado_familiar', obligatorio: 'Sí', obs: 'ENUM. Soltero, Casado, Divorciado, Viudo, Unión no matrimonial' },
    { nombre: 'nacionalidad', obligatorio: 'Sí', obs: 'VARCHAR(100). Ej.: Salvadoreña' },
    { nombre: 'profesion_oficio', obligatorio: 'Sí', obs: 'VARCHAR(150). Profesión u oficio declarado' },
    { nombre: 'id_pais', obligatorio: 'Sí', obs: 'VARCHAR(100). País de domicilio' },
    { nombre: 'id_departamento', obligatorio: 'Sí', obs: 'VARCHAR(100). Departamento' },
    { nombre: 'id_distrito', obligatorio: 'Sí', obs: 'VARCHAR(100). Distrito' },
    { nombre: 'id_municipio', obligatorio: 'Sí', obs: 'VARCHAR(100). Municipio' },
    { nombre: 'direccion', obligatorio: 'No', obs: 'TEXT. Dirección detallada' },
    { nombre: 'fecha_emision_dui', obligatorio: 'No', obs: 'DATE.' },
    { nombre: 'fecha_vencimiento_dui', obligatorio: 'No', obs: 'DATE.' }
  ];

  const insertCampoQuery = `
    INSERT INTO asistente_legal_app."CON_ENTIDAD_CAMPOS" 
    (id_entidad, nombre_campo, es_obligatorio, observaciones) 
    VALUES ($1, $2, $3, $4)
  `;

  for (const c of camposNatural) {
    await client.query(insertCampoQuery, [idNatural, c.nombre, c.obligatorio, c.obs]);
  }
  
  console.log('Fields for Natural inserted successfully.');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
