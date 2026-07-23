const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  const insertQuery = `
    INSERT INTO asistente_legal_app."CON_ROLES" (nombre_rol, id_rol_par)
    VALUES 
      ('Representante Legal', NULL),
      ('Testigo', NULL),
      ('Intérprete', NULL)
    RETURNING *;
  `;
  
  try {
    const res = await client.query(insertQuery);
    console.log('Inserted additional roles:');
    console.table(res.rows);
  } catch (e) {
    console.error('Error inserting roles:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
