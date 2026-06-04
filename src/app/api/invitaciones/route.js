import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { usuario_id_que_invito, nombre_invitado, correo_invitado, numero_whatsapp_invitado } = await request.json();

    if (!usuario_id_que_invito || !nombre_invitado || !correo_invitado) {
      return NextResponse.json({ success: false, error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Generate a secure random token (8 characters)
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();

    const insertText = `
      INSERT INTO "notarioElite".invitaciones 
      (usuario_id_que_invito, nombre_invitado, correo_invitado, numero_whatsapp_invitado, token)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await query(insertText, [
      usuario_id_que_invito,
      nombre_invitado,
      correo_invitado,
      numero_whatsapp_invitado || null,
      token
    ]);

    const newInvitacion = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Invitación creada exitosamente',
      invitacion: newInvitacion
    });
  } catch (error) {
    console.error('Error al crear invitación:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', details: error.message }, { status: 500 });
  }
}
