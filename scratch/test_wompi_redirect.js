const token = "YOUR_TOKEN"; // I will fetch it
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function main() {
  const config = await pool.query("SELECT * FROM wompi_config");
  const urlParams = new URLSearchParams();
  urlParams.append('grant_type', 'client_credentials');
  urlParams.append('client_id', config.rows[0].app_id);
  urlParams.append('client_secret', config.rows[0].api_secret);
  urlParams.append('audience', 'wompi_api');

  const tokenRes = await fetch('https://id.wompi.sv/connect/token', { method: 'POST', body: urlParams });
  const tokenData = await tokenRes.json();

  const now = new Date();
  const fechaInicio = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Restar 6 horas para "engañar" a Wompi si no lee bien la Z
  const fechaFin = new Date(fechaInicio.getTime() + 24 * 60 * 60 * 1000);

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
    infoProducto: { descripcionProducto: "TEST" },
    configuracion: {
      urlRedirect: "http://localhost:3000/api/pagos/wompi/retorno",
      esMontoEditable: false,
      esCantidadEditable: false,
      cantidadPorDefecto: 1,
      duracionInterfazIntentoMinutos: 15,
      urlRetorno: "http://localhost:3000/api/pagos/wompi/retorno",
      emailsNotificacion: "",
      urlWebhook: "https://sere-notario.vercel.app/api/pagos/wompi/webhook",
      notificarTransaccionCliente: true
    },
    vigencia: {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString()
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

  const data = await response.json();
  console.log("CREADO:", data.urlEnlace);

  // Intentemos seguir el enlace para ver si falla
  const follow = await fetch(data.urlEnlace, { redirect: 'manual' });
  console.log("FOLLOW STATUS:", follow.status, follow.headers.get('location'));
  
  if (follow.headers.get('location')) {
      const follow2 = await fetch(follow.headers.get('location'), { redirect: 'manual' });
      console.log("FINAL REDIRECT:", follow2.status, follow2.headers.get('location'));
  }

  pool.end();
}
main();
