const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  // 1. Create CON_ENTIDADES
  const createEntidades = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."CON_ENTIDADES" (
      id_entidad SERIAL PRIMARY KEY,
      nombre_entidad TEXT NOT NULL
    );
  `;
  await client.query(createEntidades);
  console.log('Table CON_ENTIDADES created.');

  // 2. Create CON_ENTIDAD_CAMPOS
  const createCampos = `
    CREATE TABLE IF NOT EXISTS asistente_legal_app."CON_ENTIDAD_CAMPOS" (
      id_entidad_campo SERIAL PRIMARY KEY,
      id_entidad INT NOT NULL REFERENCES asistente_legal_app."CON_ENTIDADES"(id_entidad),
      nombre_campo TEXT NOT NULL,
      es_obligatorio VARCHAR(20),
      observaciones TEXT
    );
  `;
  await client.query(createCampos);
  console.log('Table CON_ENTIDAD_CAMPOS created.');

  // 3. Populate CON_ENTIDADES
  const insertEntidades = `
    INSERT INTO asistente_legal_app."CON_ENTIDADES" (nombre_entidad) 
    VALUES ('Natural'), ('Juridico') 
    RETURNING id_entidad, nombre_entidad;
  `;
  const resEntidades = await client.query(insertEntidades);
  console.log('Entities inserted:', resEntidades.rows);
  
  const idJuridico = resEntidades.rows.find(r => r.nombre_entidad === 'Juridico').id_entidad;

  // 4. Populate CON_ENTIDAD_CAMPOS for 'Juridico'
  const camposJuridico = [
    { nombre: 'Razón social', obligatorio: 'Sí', obs: 'Ej.: ABC Comercial, S.A. de C.V.' },
    { nombre: 'Nombre comercial', obligatorio: 'No', obs: 'Si es diferente' },
    { nombre: 'Tipo de sociedad', obligatorio: 'Sí', obs: 'S.A. de C.V., S. de R.L., etc.' },
    { nombre: 'Número de NIT', obligatorio: 'Sí', obs: 'Identificación tributaria' },
    { nombre: 'NRC', obligatorio: 'Opcional', obs: 'Si aplica' },
    { nombre: 'Nacionalidad', obligatorio: 'Sí', obs: 'Generalmente salvadoreña' },
    { nombre: 'Domicilio', obligatorio: 'Sí', obs: 'Municipio y departamento' },
    { nombre: 'Dirección', obligatorio: 'Opcional', obs: 'Puede ser útil' },
    { nombre: 'Fecha de constitución', obligatorio: 'Frecuente', obs: 'Según escritura' },
    { nombre: 'Número de escritura de constitución', obligatorio: 'Frecuente', obs: '' },
    { nombre: 'Fecha de inscripción', obligatorio: 'Frecuente', obs: '' },
    { nombre: 'Registro de Comercio', obligatorio: 'Sí', obs: 'Número de inscripción' },
    { nombre: 'Libro', obligatorio: 'Frecuente', obs: '' },
    { nombre: 'Folio', obligatorio: 'Frecuente', obs: '' },
    { nombre: 'Tomo', obligatorio: 'Frecuente', obs: '' },
    { nombre: 'Matrícula de empresa', obligatorio: 'Opcional', obs: '' },
    { nombre: 'Giro o finalidad', obligatorio: 'Opcional', obs: 'Dependiendo del acto' },
  ];

  const insertCampoQuery = `
    INSERT INTO asistente_legal_app."CON_ENTIDAD_CAMPOS" 
    (id_entidad, nombre_campo, es_obligatorio, observaciones) 
    VALUES ($1, $2, $3, $4)
  `;

  for (const c of camposJuridico) {
    await client.query(insertCampoQuery, [idJuridico, c.nombre, c.obligatorio, c.obs]);
  }
  
  console.log('Fields for Juridico inserted successfully.');

}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
