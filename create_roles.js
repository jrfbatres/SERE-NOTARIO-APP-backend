const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  try {
    await client.query('BEGIN');
    
    // 1. Create table
    const createTableQuery = `
      CREATE TABLE asistente_legal_app."CON_ROLES" (
        id_rol SERIAL PRIMARY KEY,
        id_pais TEXT REFERENCES asistente_legal_app."CON_Pais"(id_pais),
        nombre_rol TEXT NOT NULL,
        id_rol_par INT REFERENCES asistente_legal_app."CON_ROLES"(id_rol)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table CON_ROLES created.');
    
    // 2. Insert pairs
    const pairs = [
      ['Otorgante', 'Compareciente'],
      ['Vendedor', 'Comprador'],
      ['Deudor', 'Acreedor'],
      ['Apoderante', 'Apoderado'],
      ['Donante', 'Donatario'],
      ['Arrendante', 'Arrendatario'],
      ['Testador', 'Heredero']
    ];
    
    for (const [rolA, rolB] of pairs) {
      // Insert Rol A
      const resA = await client.query(`
        INSERT INTO asistente_legal_app."CON_ROLES" (nombre_rol) VALUES ($1) RETURNING id_rol;
      `, [rolA]);
      const idA = resA.rows[0].id_rol;
      
      // Insert Rol B with id_rol_par = idA
      const resB = await client.query(`
        INSERT INTO asistente_legal_app."CON_ROLES" (nombre_rol, id_rol_par) VALUES ($1, $2) RETURNING id_rol;
      `, [rolB, idA]);
      const idB = resB.rows[0].id_rol;
      
      // Update Rol A with id_rol_par = idB
      await client.query(`
        UPDATE asistente_legal_app."CON_ROLES" SET id_rol_par = $1 WHERE id_rol = $2;
      `, [idB, idA]);
      
      console.log(`Inserted pair: ${rolA} (ID: ${idA}) <--> ${rolB} (ID: ${idB})`);
    }
    
    await client.query('COMMIT');
    console.log('Roles inserted successfully.');
    
    const finalRes = await client.query('SELECT * FROM asistente_legal_app."CON_ROLES" ORDER BY id_rol;');
    console.table(finalRes.rows);
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Connection error:', err);
    client.end();
  });
