import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Mark admin replies as read for this user
    await query(
      `UPDATE "notarioElite".soporte_mensajes 
       SET leido = true 
       WHERE usuario_id = $1 AND es_admin = true AND leido = false`,
      [userId]
    );

    // 2. Fetch history
    const history = await query(
      `SELECT id, mensaje, creado_en, es_admin, leido 
       FROM "notarioElite".soporte_mensajes 
       WHERE usuario_id = $1 
       ORDER BY creado_en ASC`,
      [userId]
    );

    return NextResponse.json({ success: true, data: history.rows });
  } catch (error) {
    console.error('Error fetching support chat:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { mensaje } = await request.json();

    if (!mensaje || mensaje.trim() === '') {
      return NextResponse.json({ success: false, error: 'El mensaje no puede estar vacío.' }, { status: 400 });
    }

    if (mensaje.length > 150) {
      return NextResponse.json({ success: false, error: 'El mensaje no puede superar los 150 caracteres.' }, { status: 400 });
    }

    // Check if the last message in this thread is already from the admin
    const lastMsgRes = await query(
      `SELECT es_admin FROM "notarioElite".soporte_mensajes 
       WHERE usuario_id = $1 
       ORDER BY creado_en DESC LIMIT 1`,
      [userId]
    );

    const shouldAutoReply = lastMsgRes.rows.length === 0 || !lastMsgRes.rows[0].es_admin;

    const result = await query(
      `INSERT INTO "notarioElite".soporte_mensajes (usuario_id, mensaje, es_admin, leido) 
       VALUES ($1, $2, false, false) 
       RETURNING *`,
      [userId, mensaje.trim()]
    );

    if (shouldAutoReply) {
      const autoReplyText = "En estos momentos, los mensajes se revisan al final del día. Les responderemos a la brevedad posible.";
      await query(
        `INSERT INTO "notarioElite".soporte_mensajes (usuario_id, mensaje, es_admin, leido) 
         VALUES ($1, $2, true, false)`,
        [userId, autoReplyText]
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error sending support message:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
