import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { awardInvitations } from '@/lib/invitaciones';

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nodo_id = searchParams.get('nodo_id');

    if (!nodo_id) {
      return NextResponse.json({ success: false, error: 'nodo_id is required' }, { status: 400 });
    }

    const result = await query(`
      SELECT bloque_actual 
      FROM "notarioElite".usuario_nodos 
      WHERE usuario_id = $1 AND nodo_id = $2
    `, [userId, nodo_id]);

    const bloque = result.rows.length > 0 ? result.rows[0].bloque_actual : 0;

    return NextResponse.json({ success: true, data: bloque });
  } catch (error) {
    console.error('Error fetching bloque actual:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { nodo_id, bloque_actual } = await request.json();

    if (!nodo_id || bloque_actual === undefined) {
      return NextResponse.json({ success: false, error: 'nodo_id and bloque_actual are required' }, { status: 400 });
    }

    // Obtener el ley_id del nodo
    const nodeRes = await query(`
      SELECT ley_id FROM "notarioElite".nodos WHERE id = $1
    `, [nodo_id]);

    if (nodeRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Node not found' }, { status: 404 });
    }

    const leyId = nodeRes.rows[0].ley_id;

    // Upsert a usuario_nodos
    await query(`
      INSERT INTO "notarioElite".usuario_nodos (usuario_id, nodo_id, ley_id, bloque_actual, completado, actualizado_en)
      VALUES ($1::uuid, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
      ON CONFLICT (usuario_id, nodo_id) 
      DO UPDATE SET 
        bloque_actual = EXCLUDED.bloque_actual,
        actualizado_en = CURRENT_TIMESTAMP
    `, [userId, nodo_id, leyId, bloque_actual]);

    let invitationAwarded = false;
    // Regla de invitaciones: si avanza al bloque 1 (significa que aprobó el bloque 0) y la ley es 1 o 9
    if (bloque_actual === 1 && (leyId === 1 || leyId === 9)) {
      invitationAwarded = await awardInvitations(userId, 1, `primer_bloque_ley_${leyId}`);
    }

    return NextResponse.json({ success: true, message: 'Bloque actualizado', invitationAwarded });
  } catch (error) {
    console.error('Error updating bloque actual:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
