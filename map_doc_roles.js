const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  try {
    await client.query('BEGIN');
    
    // Fetch document IDs
    const docsRes = await client.query('SELECT id_tipo_documento, nombre_tipo FROM asistente_legal_app."CON_TIPO_DOCUMENTOS"');
    const docs = {};
    docsRes.rows.forEach(r => docs[r.nombre_tipo] = r.id_tipo_documento);
    
    // Fetch role IDs
    const rolesRes = await client.query('SELECT id_rol, nombre_rol FROM asistente_legal_app."CON_ROLES"');
    const roles = {};
    rolesRes.rows.forEach(r => roles[r.nombre_rol] = r.id_rol);
    
    // Define mappings
    // format: { docName: [ { roleName, min, max, orden } ] }
    const mappings = {
      'Compra Venta de Vehículo': [
        { role: 'Vendedor', min: 1, max: null, orden: 1 },
        { role: 'Comprador', min: 1, max: null, orden: 2 }
      ],
      'Compra Venta de Vivienda': [
        { role: 'Vendedor', min: 1, max: null, orden: 1 },
        { role: 'Comprador', min: 1, max: null, orden: 2 }
      ],
      'Poder General Judicial': [
        { role: 'Apoderante', min: 1, max: null, orden: 1 },
        { role: 'Apoderado', min: 1, max: null, orden: 2 }
      ],
      'Poder Especial': [
        { role: 'Apoderante', min: 1, max: null, orden: 1 },
        { role: 'Apoderado', min: 1, max: null, orden: 2 }
      ],
      'Contrato de Arrendamiento de Vivienda': [
        { role: 'Arrendante', min: 1, max: null, orden: 1 },
        { role: 'Arrendatario', min: 1, max: null, orden: 2 }
      ],
      'Contrato de Arrendamiento de UBER': [
        { role: 'Arrendante', min: 1, max: null, orden: 1 },
        { role: 'Arrendatario', min: 1, max: null, orden: 2 }
      ]
    };
    
    for (const [docName, docRoles] of Object.entries(mappings)) {
      const docId = docs[docName];
      if (!docId) {
        console.warn(`Document '${docName}' not found.`);
        continue;
      }
      
      for (const r of docRoles) {
        const roleId = roles[r.role];
        if (!roleId) {
          console.warn(`Role '${r.role}' not found.`);
          continue;
        }
        
        await client.query(`
          INSERT INTO asistente_legal_app."CON_TIPO_DOCUMENTOS_ROLES" 
          (id_tipo_documento, id_rol, cantidad_minima, cantidad_maxima, orden)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING;
        `, [docId, roleId, r.min, r.max, r.orden]);
      }
    }
    
    await client.query('COMMIT');
    console.log('Roles mapped to documents successfully.');
    
    // View results
    const results = await client.query(`
      SELECT 
        d.nombre_tipo as "Documento",
        r.nombre_rol as "Rol",
        dr.cantidad_minima as "Min",
        COALESCE(dr.cantidad_maxima::text, 'Infinito') as "Max",
        dr.orden as "Orden"
      FROM asistente_legal_app."CON_TIPO_DOCUMENTOS_ROLES" dr
      JOIN asistente_legal_app."CON_TIPO_DOCUMENTOS" d ON dr.id_tipo_documento = d.id_tipo_documento
      JOIN asistente_legal_app."CON_ROLES" r ON dr.id_rol = r.id_rol
      ORDER BY d.nombre_tipo, dr.orden;
    `);
    
    console.table(results.rows);
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error inserting mappings:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
