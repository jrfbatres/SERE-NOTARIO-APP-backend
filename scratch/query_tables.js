const { Client } = require('pg');
const c = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');
c.connect()
 .then(() => c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='notarioElite'"))
 .then(r => { console.log(r.rows); c.end(); });
