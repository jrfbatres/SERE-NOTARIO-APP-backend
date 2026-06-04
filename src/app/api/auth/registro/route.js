import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { nombre, correo, clave } = await request.json();

    if (!nombre || !correo || !clave) {
      return NextResponse.json({ success: false, error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // Check if user already exists
    const checkText = `
      SELECT id FROM "notarioElite".usuarios 
      WHERE correo = $1
    `;
    const checkResult = await query(checkText, [correo]);

    if (checkResult.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'El correo ya está registrado' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedClave = await bcrypt.hash(clave, salt);

    // Insert user
    // ban_pago defaults to false (not subscribed yet), fecha_vence can be null
    const insertText = `
      INSERT INTO "notarioElite".usuarios (nombre, correo, clave, ban_pago)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, correo, ban_pago
    `;
    const insertResult = await query(insertText, [nombre, correo, hashedClave, false]);

    const newUser = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser
    });
  } catch (error) {
    console.error('Error al registrar:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', details: error.message }, { status: 500 });
  }
}
