import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export async function POST(request) {
  try {
    const { token, nuevaClave } = await request.json();

    if (!token || !nuevaClave) {
      return NextResponse.json({ success: false, error: 'Token y nueva contraseña son requeridos' }, { status: 400 });
    }

    if (nuevaClave.length < 6) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'El enlace ha expirado o es inválido' }, { status: 401 });
    }

    if (decoded.type !== 'reset' || !decoded.userId) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Verify user exists
    const userResult = await query(
      `SELECT id FROM "notarioElite".usuarios WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedClave = await bcrypt.hash(nuevaClave, salt);

    // Update password
    await query(
      `UPDATE "notarioElite".usuarios SET clave = $1 WHERE id = $2`,
      [hashedClave, userId]
    );

    return NextResponse.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    return NextResponse.json({ success: false, error: 'Ocurrió un error interno' }, { status: 500 });
  }
}
