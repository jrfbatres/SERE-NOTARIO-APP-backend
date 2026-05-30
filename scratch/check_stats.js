const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
c.connect().then(()=>c.query('SELECT nombre, total_preguntas, porcentaje_preguntas FROM "notarioElite".nodos WHERE ley_id=10')).then(r=>{console.table(r.rows); c.end()});
