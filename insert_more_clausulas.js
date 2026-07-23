const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

const clausulas = [
  // Nuevas cláusulas para UBER (id = 4)
  {
    id_tipo_documento: 4,
    descripcion: 'Taller Autorizado',
    valor: 'El arrendatario se compromete a realizar todos los mantenimientos y reparaciones del vehículo única y exclusivamente en el taller predeterminado autorizado por el arrendador.'
  },
  {
    id_tipo_documento: 4,
    descripcion: 'Prohibición de Conducir bajo Efectos del Alcohol',
    valor: 'Queda estrictamente prohibido que el arrendatario conduzca el vehículo bajo los efectos del alcohol, drogas, estupefacientes o cualquier otra sustancia que altere sus sentidos.'
  },
  {
    id_tipo_documento: 4,
    descripcion: 'Responsabilidad Civil',
    valor: 'El arrendatario asume total y absoluta responsabilidad civil, penal y administrativa frente a terceros por cualquier accidente, daño o siniestro ocasionado con el vehículo.'
  },
  
  // Nuevas cláusulas para Vivienda (id = 5)
  {
    id_tipo_documento: 5,
    descripcion: 'Subarrendamiento',
    valor: 'Se autoriza expresamente al arrendatario para poder subarrendar, total o parcialmente, el inmueble objeto de este contrato bajo su propia responsabilidad.'
  },
  {
    id_tipo_documento: 5,
    descripcion: 'Pago de Impuestos Municipales (Alcaldía)',
    valor: 'El pago de los impuestos, tasas y contribuciones municipales (Alcaldía) que recaigan sobre el inmueble, estarán a cargo exclusivo del arrendatario.'
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
    console.log('New clauses inserted successfully.');
  } catch (e) {
    console.error('Error inserting data:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
