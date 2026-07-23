const { Client } = require('pg');

async function main() {
  const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
  await c.connect();
  
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS "notarioElite".nodo_dias_usuario (
        id SERIAL PRIMARY KEY,
        usuario_id UUID REFERENCES "notarioElite".usuarios(id) ON DELETE CASCADE,
        pensum_id INTEGER REFERENCES "notarioElite".pensum(id) ON DELETE CASCADE,
        dia INTEGER NOT NULL,
        nodo_id VARCHAR(255) NOT NULL,
        ley_id INTEGER NOT NULL,
        bloque_actual INTEGER DEFAULT 1,
        bloques_totales INTEGER NOT NULL,
        nota NUMERIC,
        completado BOOLEAN DEFAULT false,
        fecha_estudio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(usuario_id, pensum_id, dia, nodo_id)
      )
    `);
    
    console.log('Tabla nodo_dias_usuario creada exitosamente.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await c.end();
  }
}
main();
