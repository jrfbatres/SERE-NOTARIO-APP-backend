import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate overall average grade from usuario_leyes
    const resultGlobal = await query(`
      SELECT AVG(nota) as nota_global
      FROM "notarioElite".usuario_leyes
      WHERE usuario_id = $1::uuid AND nota IS NOT NULL
    `, [userId]);

    // Fetch the last obtained score from usuarios table
    const resultLast = await query(`
      SELECT ultima_nota
      FROM "notarioElite".usuarios
      WHERE id = $1::uuid
    `, [userId]);

    const notaGlobal = resultGlobal.rows[0]?.nota_global;
    const notaUltima = resultLast.rows[0]?.ultima_nota;

    return NextResponse.json({
      success: true,
      nota_global: notaGlobal !== null && notaGlobal !== undefined ? parseFloat(notaGlobal) : null,
      nota_ultima: notaUltima !== null && notaUltima !== undefined ? parseFloat(notaUltima) : null
    });
  } catch (error) {
    console.error('Error fetching global user grade:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
