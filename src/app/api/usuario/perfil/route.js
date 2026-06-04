import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Obtener información del usuario
    const text = `
      SELECT nombre, correo, rol, ban_fundador, fecha_vence, cantidad_invitaciones, ban_plan
      FROM "notarioElite".usuarios
      WHERE id = $1
    `;
    const result = await query(text, [userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = result.rows[0];
    
    // Calcular ROL dinámicamente según las reglas
    let computedRol = userData.rol || 'Estándar';
    const now = new Date();
    
    if (userData.correo === 'admin@serenotario.com') {
      computedRol = 'Administrador';
    } else if (!userData.fecha_vence) {
      computedRol = 'DEMO';
    } else if (new Date(userData.fecha_vence) < now) {
      computedRol = 'Vencido';
    } else {
      // Vigente
      if (userData.ban_fundador) {
        computedRol = 'Fundador';
      } else if (userData.ban_plan === 'P' || userData.ban_plan === 'p') {
        computedRol = 'Premium';
      } else if (userData.ban_plan === 'B' || userData.ban_plan === 'b') {
        computedRol = 'Básico';
      }
    }

    userData.rol = computedRol;

    return NextResponse.json({ success: true, data: userData });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
  }
}
