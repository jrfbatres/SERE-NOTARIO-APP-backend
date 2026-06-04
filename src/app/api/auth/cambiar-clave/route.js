import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { awardInvitations } from '@/lib/invitaciones';

export async function POST(request) {
  try {
    const { correo, clave_actual, nueva_clave } = await request.json();

    if (!correo || !clave_actual || !nueva_clave) {
      return NextResponse.json({ success: false, error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // Buscar al usuario
    const text = `
      SELECT id, clave, ban_cambiar_clave
      FROM "notarioElite".usuarios 
      WHERE correo = $1
    `;
    const result = await query(text, [correo]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const user = result.rows[0];

    // Verificar la clave actual (que para el primer login sería el token)
    let isMatch = false;
    if (user.clave.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(clave_actual, user.clave);
    } else {
      isMatch = (clave_actual === user.clave);
    }

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'La clave actual es incorrecta' }, { status: 401 });
    }

    // Hashear la nueva clave
    const salt = await bcrypt.genSalt(10);
    const hashedNuevaClave = await bcrypt.hash(nueva_clave, salt);

    // Actualizar la clave y quitar la bandera
    const updateText = `
      UPDATE "notarioElite".usuarios 
      SET clave = $1, ban_cambiar_clave = false 
      WHERE id = $2
    `;
    await query(updateText, [hashedNuevaClave, user.id]);

    // Regla de invitaciones: Si es su primer login, intentar otorgar 1 invitación
    if (user.ban_cambiar_clave === true) {
      await awardInvitations(user.id, 1, 'cambio_clave_inicial');
    }

    return NextResponse.json({
      success: true,
      message: 'Clave actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar la clave:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', details: error.message }, { status: 500 });
  }
}
