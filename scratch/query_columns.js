const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
c.connect()
 .then(() => c.query("SELECT column_default, data_type FROM information_schema.columns WHERE table_schema='notarioElite' AND table_name='nodos' AND column_name='id'"))
 .then(r => { console.log(r.rows); c.end(); });
