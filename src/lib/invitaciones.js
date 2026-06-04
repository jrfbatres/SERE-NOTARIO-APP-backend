import { query } from '@/lib/db';

/**
 * Otorgar invitaciones a un usuario fundador si se cumplen las reglas de negocio.
 * 
 * @param {string} userId - UUID del usuario
 * @param {number} amount - Cantidad de invitaciones a otorgar
 * @param {string} reason - Motivo único (ej. 'cambio_clave_inicial', 'primer_bloque_ley_1')
 * @returns {Promise<boolean>} true si se otorgaron, false si no.
 */
export async function awardInvitations(userId, amount, reason) {
  try {
    // 1. Verificar límite global de usuarios (máximo 200)
    const countRes = await query(`SELECT COUNT(*) as total FROM "notarioElite".usuarios`);
    const totalUsuarios = parseInt(countRes.rows[0].total, 10);
    
    if (totalUsuarios >= 200) {
      console.log(`[Invitaciones] Límite de 200 usuarios alcanzado. No se otorgan invitaciones.`);
      return false;
    }

    // 2. Verificar si el usuario es fundador
    const userRes = await query(`
      SELECT ban_fundador, cantidad_invitaciones 
      FROM "notarioElite".usuarios 
      WHERE id = $1
    `, [userId]);

    if (userRes.rows.length === 0) return false;
    
    const user = userRes.rows[0];
    if (user.ban_fundador !== true) {
      return false; // Solo fundadores ganan invitaciones
    }

    // 3. Intentar insertar el log para evitar duplicados
    try {
      await query(`
        INSERT INTO "notarioElite".log_invitaciones (usuario_id, motivo, cantidad)
        VALUES ($1, $2, $3)
      `, [userId, reason, amount]);
    } catch (insertError) {
      // Si viola la restricción UNIQUE, significa que ya cobró esta recompensa.
      if (insertError.code === '23505') { // 23505 = unique_violation en Postgres
        console.log(`[Invitaciones] Recompensa '${reason}' ya fue otorgada a usuario ${userId}.`);
        return false;
      }
      throw insertError;
    }

    // 4. Sumar las invitaciones al usuario
    const currentAmount = user.cantidad_invitaciones ? parseInt(user.cantidad_invitaciones, 10) : 0;
    const newAmount = currentAmount + amount;

    await query(`
      UPDATE "notarioElite".usuarios 
      SET cantidad_invitaciones = $1 
      WHERE id = $2
    `, [newAmount, userId]);

    console.log(`[Invitaciones] Otorgadas ${amount} invitaciones a ${userId} por '${reason}'.`);
    return true;

  } catch (error) {
    console.error('[Invitaciones] Error en awardInvitations:', error);
    return false;
  }
}
