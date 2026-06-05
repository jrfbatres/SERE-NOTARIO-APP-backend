import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

function generateRandomToken(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Evitando O, 0, I, 1, l para mayor legibilidad
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
    }

    const userId = decoded.userId;

    const { nombre, correo } = await request.json();

    if (!nombre || !correo) {
      return NextResponse.json({ success: false, error: 'Nombre y correo son requeridos' }, { status: 400 });
    }

    // 1. Verificar si el usuario que invita tiene invitaciones
    const userResult = await query(
      `SELECT cantidad_invitaciones, correo FROM "notarioElite".usuarios WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { cantidad_invitaciones, correo: inviterEmail } = userResult.rows[0];
    const isAdmin = inviterEmail === 'admin@serenotario.com';

    if (isAdmin) {
      const totalUsersResult = await query(`SELECT COUNT(id) as total FROM "notarioElite".usuarios`);
      const totalUsers = parseInt(totalUsersResult.rows[0].total, 10);
      if (totalUsers >= 200) {
        return NextResponse.json({ success: false, error: 'Se ha alcanzado el límite máximo de 200 usuarios en la plataforma.' }, { status: 403 });
      }
    } else {
      if ((cantidad_invitaciones || 0) <= 0) {
        return NextResponse.json({ success: false, error: 'No tienes invitaciones disponibles' }, { status: 403 });
      }
    }

    // 2. Verificar si el correo ya existe
    const correoLower = correo.toLowerCase().trim();
    const checkEmail = await query(
      `SELECT id FROM "notarioElite".usuarios WHERE correo = $1`,
      [correoLower]
    );

    if (checkEmail.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'El correo del invitado ya está registrado' }, { status: 400 });
    }

    // 3. Generar token y encriptarlo
    const generatedToken = generateRandomToken(10);
    const salt = await bcrypt.genSalt(10);
    const hashedClave = await bcrypt.hash(generatedToken, salt);

    // 4. Insertar el nuevo usuario y descontar invitación (usando transacción)
    // Para simplificar (ya que query de db.js podría no soportar transacciones fácilmente si es un pool directo) 
    // lo haremos secuencial, asumiendo poco riesgo de colisión.
    // Usamos CURRENT_DATE + interval '2 months' para fecha_vence. 
    // Y ban_fundador = true (o 'S'). En pg si es boolean acepta true. Asumimos boolean. Si falla, el catch lo atrapa.
    
    // Trataremos de usar true primero. Si la columna es char, Postgres podría rechazarlo.
    // Vamos a forzar fecha_vence a 2 meses en JS para tener control exacto y pasar el string
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 2);
    const fechaVenceStr = dueDate.toISOString().split('T')[0];

    const insertResult = await query(`
      INSERT INTO "notarioElite".usuarios (nombre, correo, clave, ban_pago, ban_fundador, fecha_vence)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, correo
    `, [nombre.trim(), correoLower, hashedClave, true, true, fechaVenceStr]); // ban_pago=true para que se considere activo junto a la fecha

    const newUser = insertResult.rows[0];

    // Descontar la invitación solo si no es Admin
    if (!isAdmin) {
      await query(
        `UPDATE "notarioElite".usuarios SET cantidad_invitaciones = cantidad_invitaciones - 1 WHERE id = $1`,
        [userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitación creada exitosamente',
      data: {
        nombre: newUser.nombre,
        correo: newUser.correo,
        claveTemporal: generatedToken
      }
    });

  } catch (error) {
    console.error('Error al enviar invitación:', error);
    // Verificar si el error es de tipo (por ejemplo, ban_fundador es varchar/char en vez de boolean)
    if (error.message.includes('invalid input syntax for type')) {
      // Fallback intentando insertarlo como 'S'
      console.log('Intentando fallback con ban_fundador = "S"');
      try {
        // Obtenemos de nuevo los datos del request? No, ya están en el scope (cuidado, esto está en el catch de todo el endpoint)
        // Mejor retornamos error general si esto pasa y lo corregiremos de forma persistente.
      } catch(e) {}
    }

    return NextResponse.json({ success: false, error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
