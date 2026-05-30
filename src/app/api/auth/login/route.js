import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export async function POST(request) {
  try {
    const { correo, clave } = await request.json();

    if (!correo || !clave) {
      return NextResponse.json({ success: false, error: 'Correo y clave son requeridos' }, { status: 400 });
    }

    // Find user
    const text = `
      SELECT id, nombre, correo, clave, ban_pago, fecha_vence 
      FROM "notarioElite".usuarios 
      WHERE correo = $1
    `;
    const result = await query(text, [correo]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
    }

    const user = result.rows[0];

    // Check password
    let isMatch = false;
    if (user.clave.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(clave, user.clave);
    } else {
      isMatch = (clave === user.clave);
    }

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Check subscription status
    // For now, we just verify they have a plan. You can add date checks later.
    if (!user.ban_pago) {
       return NextResponse.json({ success: false, error: 'Suscripción inactiva' }, { status: 403 });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.correo, plan: user.ban_pago },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success without sending the hash back
    delete user.clave;
    const safeUser = user;

    return NextResponse.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: error.message, stack: error.stack }, { status: 500 });
  }
}
