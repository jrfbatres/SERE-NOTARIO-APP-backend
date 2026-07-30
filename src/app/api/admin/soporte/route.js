import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

// Helper to check if requesting user is administrator
async function checkAdmin(request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return null;

  const res = await query(
    `SELECT rol, correo FROM "notarioElite".usuarios WHERE id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  
  const isAdmin = user.correo === 'admin@serenotario.com' || user.rol === 'Administrador' || user.rol === 'ADMINISTRADOR';
  return isAdmin ? userId : null;
}

export async function GET(request) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');

    if (usuarioId) {
      // 1. Mark user's messages as read in this thread
      await query(
        `UPDATE "notarioElite".soporte_mensajes 
         SET leido = true 
         WHERE usuario_id = $1 AND es_admin = false AND leido = false`,
        [usuarioId]
      );

      // 2. Fetch messages history for this user
      const result = await query(
        `SELECT id, mensaje, creado_en, es_admin, leido 
         FROM "notarioElite".soporte_mensajes 
         WHERE usuario_id = $1 
         ORDER BY creado_en ASC`,
        [usuarioId]
      );
      return NextResponse.json({ success: true, data: result.rows });
    } else {
      // Fetch thread list
      const result = await query(`
        SELECT * FROM (
          SELECT DISTINCT ON (u.id)
            u.id AS usuario_id,
            u.nombre AS usuario_nombre,
            u.correo AS usuario_correo,
            m.mensaje AS ultimo_mensaje,
            m.creado_en AS fecha_ultimo_mensaje,
            (SELECT COUNT(*) FROM "notarioElite".soporte_mensajes WHERE usuario_id = u.id AND es_admin = false AND leido = false) AS mensajes_no_leidos
          FROM "notarioElite".soporte_mensajes m
          JOIN "notarioElite".usuarios u ON m.usuario_id = u.id
          ORDER BY u.id, m.creado_en DESC
        ) t
        ORDER BY t.fecha_ultimo_mensaje DESC
      `);
      return NextResponse.json({ success: true, data: result.rows });
    }
  } catch (error) {
    console.error('Error fetching admin support threads:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { usuarioId, mensaje } = body;

    if (!usuarioId || !mensaje || mensaje.trim() === '') {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    if (mensaje.length > 150) {
      return NextResponse.json({ error: 'El mensaje no puede superar los 150 caracteres.' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO "notarioElite".soporte_mensajes (usuario_id, mensaje, es_admin, leido) 
       VALUES ($1, $2, true, false) 
       RETURNING *`,
      [usuarioId, mensaje.trim()]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error sending admin reply:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
