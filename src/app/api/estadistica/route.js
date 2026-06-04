import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sere_notario_elite_key';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const userId = decoded.userId;

    const sqlText = `
      SELECT 
        l.id AS ley_id,
        l.nombre AS ley_nombre,
        l.porcentaje AS importancia,
        COUNT(n.id) AS total_nodos,
        COALESCE(SUM(CASE WHEN un.completado = true THEN 1 ELSE 0 END), 0) AS nodos_pasados
      FROM "notarioElite".leyes l
      LEFT JOIN "notarioElite".nodos n ON n.ley_id = l.id
      LEFT JOIN "notarioElite".usuario_nodos un ON un.nodo_id = n.id AND un.usuario_id = $1::uuid
      WHERE l.ban_estudiar = true
      GROUP BY l.id, l.nombre, l.porcentaje
      ORDER BY l.porcentaje DESC
    `;
    const result = await query(sqlText, [userId]);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
