import { query } from './db';

/**
 * Obtiene las credenciales de Wompi de la base de datos.
 * @returns {Promise<{app_id: string, api_secret: string} | null>}
 */
export async function getWompiCredentials() {
  const result = await query('SELECT * FROM wompi_config ORDER BY id DESC LIMIT 1');
  if (result.rows.length === 0) {
    throw new Error('No se encontraron credenciales de Wompi en la base de datos.');
  }
  return result.rows[0];
}

/**
 * Obtiene el Bearer token de Wompi necesario para hacer peticiones al API.
 * @returns {Promise<string>} El access_token
 */
export async function getWompiToken() {
  const credentials = await getWompiCredentials();

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('audience', 'wompi_api');
  params.append('client_id', credentials.app_id);
  params.append('client_secret', credentials.api_secret);

  const response = await fetch('https://id.wompi.sv/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al autenticarse con Wompi: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}
