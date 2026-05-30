const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

async function run() {
  await c.connect();
  
  const qRes = await c.query('SELECT * FROM public.preguntas WHERE codigo_id = 10');
  const preguntas = qRes.rows;
  
  console.log(`Encontradas ${preguntas.length} preguntas para transferir.`);
  let countPreguntas = 0;
  let countOpciones = 0;
  
  for (let p of preguntas) {
    let nodo_id = null;
    if (p.articulo) {
      const cleanArt = p.articulo.replace(/Art\.\\s*/i, '').trim();
      const artRes = await c.query('SELECT nodo_id FROM "notarioElite".articulos WHERE ley_id = 10 AND numero = $1 LIMIT 1', [cleanArt]);
      if (artRes.rows.length > 0) {
        nodo_id = artRes.rows[0].nodo_id;
      }
    }
    
    try {
      await c.query(`
        INSERT INTO "notarioElite".preguntas 
        (id, ley_id, nodo_id, texto_pregunta, referencia_legal, articulo, explicacion, nivel)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [p.id, 10, nodo_id, p.texto_pregunta, p.referencia_legal, p.articulo, p.explicacion, p.nivel]);
      countPreguntas++;
      
      const optRes = await c.query('SELECT * FROM public.opciones WHERE pregunta_id = $1', [p.id]);
      for (let o of optRes.rows) {
        await c.query(`
          INSERT INTO "notarioElite".opciones 
          (id, pregunta_id, texto_opcion, es_correcta, orden)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
        `, [o.id, o.pregunta_id, o.texto_opcion, o.es_correcta, o.orden]);
        countOpciones++;
      }
    } catch (e) {
      console.error('Error insertando pregunta', p.id, e.message);
    }
  }
  
  console.log(`Migración completada: ${countPreguntas} preguntas y ${countOpciones} opciones transferidas.`);
  await c.end();
}
run();
