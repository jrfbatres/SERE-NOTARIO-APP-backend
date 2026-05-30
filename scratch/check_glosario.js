const { Client } = require('pg');
const client = new Client('postgres://postgres:admin@72.61.9.7:1521/batres');

client.connect()
  .then(() => client.query("SELECT count(*) FROM \"notarioElite\".articulos WHERE ley_id = 3"))
  .then(res => {
    console.log('Total articles in Ley 3:', res.rows[0].count);
    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
