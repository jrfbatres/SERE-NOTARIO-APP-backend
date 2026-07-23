import { query } from './src/lib/db.js';
import fs from 'fs';
import path from 'path';

async function test() {
  try {
    const plan = 'express';
    let planCode = '';
    if (plan === 'express' || plan === 'lite') planCode = 'B';
    else if (plan === 'profundo') planCode = 'P';
    else if (plan === 'magistral') planCode = 'M';

    const pensumRes = await query(`SELECT id, nombre, dias_totales FROM "notarioElite".pensum WHERE ban_plan = $1 LIMIT 1`, [planCode]);
    console.log(pensumRes.rows);

    const pensum = pensumRes.rows[0];

    const diasRes = await query(`
      SELECT dia, ley_id, nodo_id, cantidad_preguntas
      FROM "notarioElite".pensum_dia 
      WHERE pensum_id = $1 
      ORDER BY dia ASC
    `, [pensum.id]);
    console.log(diasRes.rows.length);
    
    // ... rest of logic
    const userId = '11111111-1111-1111-1111-111111111111'; // dummy

    const progresoRes = await query(`
      SELECT dia, nodo_id, bloque_actual, bloques_totales, completado, nota
      FROM "notarioElite".nodo_dias_usuario
      WHERE usuario_id = $1 AND pensum_id = $2
    `, [userId, pensum.id]);

    const progresoMap = {};
    progresoRes.rows.forEach(p => {
      progresoMap[`${p.dia}-${p.nodo_id}`] = p;
    });

    const jsonPath = path.join(process.cwd(), 'leyes_nodos_data.json');
    let leyesData = { leyes: [], nodos: [] };
    if (fs.existsSync(jsonPath)) {
      leyesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }

    const getLeyName = (id) => leyesData.leyes.find(l => l.id == id)?.nombre || `Ley ${id}`;
    const getNodoName = (id) => leyesData.nodos.find(n => n.id == id)?.tema || `Nodo ${id}`;

    const daysMap = {};
    for (let i = 1; i <= pensum.dias_totales; i++) {
      daysMap[i] = {
        dia: i,
        nodos: [],
        completado: true
      };
    }

    diasRes.rows.forEach(row => {
      const pId = `${row.dia}-${row.nodo_id}`;
      const prog = progresoMap[pId];
      
      const bloquesTotalesCalculados = Math.ceil(row.cantidad_preguntas / 5);

      const nodeData = {
        ley_id: row.ley_id,
        ley_nombre: getLeyName(row.ley_id),
        nodo_id: row.nodo_id,
        nodo_nombre: getNodoName(row.nodo_id),
        cantidad_preguntas: row.cantidad_preguntas,
        bloques_totales: prog?.bloques_totales || bloquesTotalesCalculados,
        bloque_actual: prog?.bloque_actual || 1,
        completado: prog?.completado || false,
        nota: prog?.nota || null
      };

      if (!nodeData.completado) {
        daysMap[row.dia].completado = false;
      }

      if (daysMap[row.dia]) {
        daysMap[row.dia].nodos.push(nodeData);
      }
    });

    Object.values(daysMap).forEach(d => {
      if (d.nodos.length === 0) d.completado = false;
    });

    console.log(Object.values(daysMap)[0]);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
