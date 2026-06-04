import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'El token es requerido' }, { status: 400 });
    }

    // Check if invitation exists and is not used
    const checkText = `
      SELECT id, nombre_invitado, correo_invitado 
      FROM "notarioElite".invitaciones 
      WHERE token = $1 AND usada = false
    `;
    const checkResult = await query(checkText, [token]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invitación inválida o ya ha sido utilizada' }, { status: 400 });
    }

    const invitacion = checkResult.rows[0];

    // Mark as used
    const updateInvText = `
      UPDATE "notarioElite".invitaciones 
      SET usada = true, fecha_uso = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await query(updateInvText, [invitacion.id]);

    // Check if user already exists
    const checkUserText = `SELECT id FROM "notarioElite".usuarios WHERE correo = $1`;
    const checkUserResult = await query(checkUserText, [invitacion.correo_invitado]);

    if (checkUserResult.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'El correo ya está registrado' }, { status: 400 });
    }

    // Create user
    const salt = await bcrypt.genSalt(10);
    const hashedClave = await bcrypt.hash(token, salt);

    // ban_pago = 'true', fecha_vence = +2 months, ban_fundador = true, ban_cambiar_clave = true, ban_plan = 'basico'
    const insertUserText = `
      INSERT INTO "notarioElite".usuarios 
      (nombre, correo, clave, ban_pago, ban_plan, fecha_vence, ban_fundador, ban_cambiar_clave)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '2 months', $6, $7)
      RETURNING id, nombre, correo, ban_pago, fecha_vence
    `;
    
    const insertResult = await query(insertUserText, [
      invitacion.nombre_invitado,
      invitacion.correo_invitado,
      hashedClave,
      'true',      // ban_pago
      'basico',    // ban_plan
      true,        // ban_fundador
      true         // ban_cambiar_clave
    ]);

    const newUser = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Invitación aceptada. Usuario creado exitosamente.',
      user: newUser
    });
  } catch (error) {
    console.error('Error al aceptar invitación:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', details: error.message }, { status: 500 });
  }
}
