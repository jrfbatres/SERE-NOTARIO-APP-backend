const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

const queries = `
-- 1. Agregar bloque_actual a usuario_nodos
ALTER TABLE "notarioElite".usuario_nodos 
ADD COLUMN IF NOT EXISTS bloque_actual INTEGER DEFAULT 0;

-- 2. Crear tabla log_invitaciones
CREATE TABLE IF NOT EXISTS "notarioElite".log_invitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES "notarioElite".usuarios(id) ON DELETE CASCADE,
    motivo VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, motivo)
);
`;

client.connect().then(() => {
  console.log('Connected to DB. Executing schema updates...');
  return client.query(queries);
}).then(res => {
  console.log('DB schema updated successfully.');
  client.end();
}).catch(err => {
  console.error('DB Error:', err);
  client.end();
});
