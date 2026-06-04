const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

const query = `
CREATE TABLE IF NOT EXISTS "notarioElite".invitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id_que_invito UUID REFERENCES "notarioElite".usuarios(id) ON DELETE CASCADE,
    nombre_invitado VARCHAR(255) NOT NULL,
    correo_invitado VARCHAR(255) NOT NULL,
    numero_whatsapp_invitado VARCHAR(50),
    fecha_invitacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    token VARCHAR(255) UNIQUE NOT NULL,
    usada BOOLEAN DEFAULT FALSE,
    fecha_uso TIMESTAMP WITH TIME ZONE
);
`;

client.connect().then(() => {
  console.log('Connected to DB. Creating table invitaciones...');
  return client.query(query);
}).then(res => {
  console.log('Table created successfully');
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
