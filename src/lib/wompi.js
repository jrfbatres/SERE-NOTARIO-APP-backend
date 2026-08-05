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

/**
 * Sincroniza los pagos pendientes de un usuario con Wompi.
 * @param {string} usuarioId El ID del usuario.
 * @returns {Promise<{success: boolean, actualizados: number, message?: string}>}
 */
export async function sincronizarPagosUsuario(usuarioId) {
  // Buscar pagos pendientes que tengan id_wompi
  const pendientesRes = await query(
    `SELECT * FROM usuario_pagos 
     WHERE usuario_id = $1 
       AND estado = 'PENDIENTE' 
       AND id_wompi IS NOT NULL`,
    [usuarioId]
  );

  const pendientes = pendientesRes.rows;
  let actualizados = 0;

  if (pendientes.length === 0) {
    return { success: true, actualizados: 0, message: "No hay pagos pendientes sincronizables." };
  }

  const token = await getWompiToken();

  for (const pago of pendientes) {
    try {
      // Consultar el estado en Wompi
      const response = await fetch(`https://api.wompi.sv/EnlacePago/${pago.id_wompi}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Si la cantidad de pagos exitosos es mayor a 0, significa que se pagó
        if (data.cantidadPagosExitosos && data.cantidadPagosExitosos > 0) {
          
          const mesesDuracion = pago.meses_duracion || 1;
          
          // 1. Actualizar usuario_pagos
          await query(
            `UPDATE usuario_pagos 
             SET estado = 'PAGADO', 
                 fecha_pago = NOW(),
                 fecha_vencimiento = NOW() + ($1 || ' months')::interval
             WHERE id = $2`,
            [mesesDuracion, pago.id]
          );

          // 2. Calcular ban_nodos_libres y banPlan
          let banNodosLibres = 'N';
          let banPlan = 'B'; // Default to Lite
          const montoNum = parseFloat(pago.monto);
          
          if (montoNum === 10) {
            banNodosLibres = 'S';
            banPlan = 'P'; // Profundo
          } else if (montoNum === 15) {
            banNodosLibres = 'S';
            banPlan = 'C'; // Completo
          } else if (montoNum === 5) {
            banNodosLibres = 'N';
            banPlan = 'B'; // Lite
          } else if (montoNum === 20 || montoNum === 80) {
            banNodosLibres = 'S';
            banPlan = 'C';
          }

          // 3. Actualizar maestro de usuarios
          await query(
            `UPDATE usuarios 
             SET fecha_pago = NOW(),
                 fecha_vence = NOW() + ($1 || ' months')::interval,
                 ban_pago = 'S',
                 ban_nodos_libres = $2,
                 ban_plan = $3
             WHERE id = $4`,
            [mesesDuracion, banNodosLibres, banPlan, usuarioId]
          );

          actualizados++;
        }
      }
    } catch (err) {
      console.error(`Error sincronizando el pago ${pago.id}:`, err);
    }
  }

  return { success: true, actualizados };
}

