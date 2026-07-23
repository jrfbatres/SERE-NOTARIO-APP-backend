const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

const clausulas = [
  // Contrato de Arrendamiento de UBER (id = 4)
  {
    id_tipo_documento: 4,
    descripcion: 'Plazo del Arrendamiento',
    valor: 'El plazo del presente contrato de arrendamiento será de X meses, contados a partir del día X del mes X del año X.'
  },
  {
    id_tipo_documento: 4,
    descripcion: 'Canon de Arrendamiento',
    valor: 'El arrendatario pagará al arrendador la cantidad de X dólares semanales en concepto de canon de arrendamiento.'
  },
  {
    id_tipo_documento: 4,
    descripcion: 'Uso del Vehículo',
    valor: 'El vehículo arrendado será destinado única y exclusivamente para la prestación del servicio de transporte privado a través de la plataforma Uber.'
  },
  {
    id_tipo_documento: 4,
    descripcion: 'Mantenimiento y Reparaciones',
    valor: 'El arrendatario se obliga a mantener el vehículo en perfecto estado de funcionamiento, asumiendo los costos de mantenimiento preventivo y correctivo.'
  },
  {
    id_tipo_documento: 4,
    descripcion: 'Seguros',
    valor: 'El vehículo cuenta con una póliza de seguro de cobertura amplia, cuyo deducible en caso de siniestro correrá por cuenta del arrendatario.'
  },
  
  // Contrato de Arrendamiento de Vivienda (id = 5)
  {
    id_tipo_documento: 5,
    descripcion: 'Plazo del Arrendamiento',
    valor: 'El plazo de duración del presente contrato es de un año forzoso para ambas partes, iniciando el día X del mes X del año X.'
  },
  {
    id_tipo_documento: 5,
    descripcion: 'Canon de Arrendamiento',
    valor: 'El canon de arrendamiento mensual será la suma de X dólares, pagaderos por mes anticipado dentro de los primeros X días de cada mes.'
  },
  {
    id_tipo_documento: 5,
    descripcion: 'Destino del Inmueble',
    valor: 'El arrendatario destinará el inmueble exclusivamente para vivienda suya y de su grupo familiar, quedando prohibido destinarlo a fines comerciales.'
  },
  {
    id_tipo_documento: 5,
    descripcion: 'Pago de Servicios Públicos',
    valor: 'El pago de los servicios públicos de energía eléctrica, agua potable, internet y telefonía serán por cuenta exclusiva del arrendatario.'
  },
  {
    id_tipo_documento: 5,
    descripcion: 'Mejoras y Modificaciones',
    valor: 'El arrendatario no podrá realizar mejoras ni modificaciones en el inmueble sin el consentimiento previo y por escrito del arrendador.'
  }
];

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const insertQuery = `
    INSERT INTO asistente_legal_app."CON_TIPO_DOCUMENTO_CLAUSULAS" 
    (id_tipo_documento, descripcion, valor) 
    VALUES ($1, $2, $3)
  `;
  
  try {
    for (const c of clausulas) {
      await client.query(insertQuery, [c.id_tipo_documento, c.descripcion, c.valor]);
      console.log(`Inserted clause '${c.descripcion}' for document type ${c.id_tipo_documento}`);
    }
    console.log('All clauses inserted successfully.');
  } catch (e) {
    console.error('Error inserting data:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
