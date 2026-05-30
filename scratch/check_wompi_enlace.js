const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function check() {
  const config = await pool.query("SELECT * FROM wompi_config");
  const urlParams = new URLSearchParams();
  urlParams.append('grant_type', 'client_credentials');
  urlParams.append('client_id', config.rows[0].app_id);
  urlParams.append('client_secret', config.rows[0].api_secret);
  urlParams.append('audience', 'wompi_api');

  const tokenRes = await fetch('https://id.wompi.sv/connect/token', { method: 'POST', body: urlParams });
  const tokenData = await tokenRes.json();

  const response = await fetch(`https://api.wompi.sv/EnlacePago/3747439`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenData.access_token}`
    }
  });

  const data = await response.json();
  console.log("DATOS DE WOMPI DEL ENLACE PAGADO:", JSON.stringify(data, null, 2));

  pool.end();
}
check();
