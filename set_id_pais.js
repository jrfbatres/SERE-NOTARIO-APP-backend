const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect().then(async () => {
  console.log('Connected to DB');
  
  try {
    await client.query('BEGIN');
    
    // Check if SV exists in CON_Pais
    const paisRes = await client.query(`SELECT id_pais FROM asistente_legal_app."CON_Pais" WHERE id_pais = 'SV';`);
    if (paisRes.rows.length === 0) {
      // Insert SV into CON_Pais (assuming columns: id_pais, nombre)
      // Actually, earlier the columns were id (renamed to id_pais) and nombre
      await client.query(`INSERT INTO asistente_legal_app."CON_Pais" (id_pais, nombre) VALUES ('SV', 'El Salvador') ON CONFLICT DO NOTHING;`);
      console.log('Inserted SV into CON_Pais');
    }
    
    // Update CON_ROLES
    await client.query(`UPDATE asistente_legal_app."CON_ROLES" SET id_pais = 'SV';`);
    console.log('Updated CON_ROLES');
    
    // Update CON_CATEGORIA_DOCUMENTOS
    await client.query(`UPDATE asistente_legal_app."CON_CATEGORIA_DOCUMENTOS" SET id_pais = 'SV';`);
    console.log('Updated CON_CATEGORIA_DOCUMENTOS');
    
    await client.query('COMMIT');
    console.log('All tables updated with id_pais = SV');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error updating id_pais:', e);
  }
  
}).then(() => client.end())
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
