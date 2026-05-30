const token = "YOUR_TOKEN"; // I will just fetch it from the DB
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function main() {
  // get token
  const config = await pool.query("SELECT * FROM wompi_config");
  const urlParams = new URLSearchParams();
  urlParams.append('grant_type', 'client_credentials');
  urlParams.append('client_id', config.rows[0].app_id);
  urlParams.append('client_secret', config.rows[0].api_secret);
  urlParams.append('audience', 'wompi_api');

  const tokenRes = await fetch('https://id.wompi.sv/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: urlParams
  });
  const tokenData = await tokenRes.json();

  const payload = {
    identificadorEnlaceComercio: `TEST-${Date.now()}`,
    monto: 15,
    nombreProducto: "TEST",
    formaPago: {
      permitirTarjetaCreditoDebido: true,
      permitirPagoConPuntoAgricola: true,
      permitirPagoEnCuotasAgricola: false,
      permitirPagoEnBitcoin: true,
      permitePagoQuickPay: true,
    },
    infoProducto: {
      descripcionProducto: "TEST"
    },
    configuracion: {
      urlRedirect: "http://localhost:3000",
      esMontoEditable: false,
      esCantidadEditable: false,
      cantidadPorDefecto: 1,
      duracionInterfazIntentoMinutos: 15,
      urlRetorno: "http://localhost:3000",
      emailsNotificacion: "",
      urlWebhook: "http://localhost:3000",
      telefonosNotificacion: "",
      notificarTransaccionCliente: true
    },
    vigencia: {
      fechaInicio: new Date().toISOString(),
      fechaFin: new Date(Date.now() + 86400000).toISOString()
    },
    limitesDeUso: {
      cantidadMaximaPagosExitosos: 1,
      cantidadMaximaPagosFallidos: 3
    }
  };

  const response = await fetch('https://api.wompi.sv/EnlacePago', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenData.access_token}`
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log("STATUS:", response.status);
  console.log("RESPONSE:", text);
  pool.end();
}
main();
