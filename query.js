const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
client.connect()
  .then(() => client.query('SELECT nombre, porcentaje_preguntas FROM "notarioElite".nodos WHERE porcentaje_preguntas IS NOT NULL LIMIT 30'))
  .then(res => {
    console.log(res.rows.map(r => Number(r.porcentaje_preguntas)));
    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
