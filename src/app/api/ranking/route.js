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
      WITH LeyesTotales AS (
        SELECT ley_id, COUNT(id) as total_nodos
        FROM "notarioElite".nodos
        GROUP BY ley_id
      ),
      LeyesUsuario AS (
        SELECT 
          un.usuario_id, 
          un.ley_id, 
          COUNT(un.nodo_id) as nodos_pasados
        FROM "notarioElite".usuario_nodos un
        WHERE un.completado = true
        GROUP BY un.usuario_id, un.ley_id
      ),
      LeyesCompletadas AS (
        SELECT lu.usuario_id, COUNT(*) as leyes_completadas
        FROM LeyesUsuario lu
        JOIN LeyesTotales lt ON lt.ley_id = lu.ley_id
        WHERE lu.nodos_pasados = lt.total_nodos
        GROUP BY lu.usuario_id
      ),
      NodosTotalesUsuario AS (
        SELECT usuario_id, COUNT(*) as nodos_pasados
        FROM "notarioElite".usuario_nodos
        WHERE completado = true
        GROUP BY usuario_id
      ),
      Ranking AS (
        SELECT 
          u.id, 
          u.nombre,
          COALESCE(lc.leyes_completadas, 0) as leyes_completadas,
          COALESCE(ntu.nodos_pasados, 0) as nodos_pasados,
          ROW_NUMBER() OVER(ORDER BY COALESCE(lc.leyes_completadas, 0) DESC, COALESCE(ntu.nodos_pasados, 0) DESC) as posicion
        FROM "notarioElite".usuarios u
        LEFT JOIN LeyesCompletadas lc ON lc.usuario_id = u.id
        LEFT JOIN NodosTotalesUsuario ntu ON ntu.usuario_id = u.id
      )
      SELECT * FROM Ranking ORDER BY posicion ASC;
    `;
    
    const result = await query(sqlText);
    const allUsers = result.rows;

    // Obtener los primeros 50
    const topUsers = allUsers.slice(0, 50);

    // Encontrar al usuario actual
    const currentUserRank = allUsers.find(u => u.id === userId);

    return NextResponse.json({
      success: true,
      data: {
        topUsers,
        currentUserRank
      }
    });
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
