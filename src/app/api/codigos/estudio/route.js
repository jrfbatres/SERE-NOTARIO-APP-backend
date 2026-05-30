import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Query to fetch laws from the "leyes" table where ban_estudiar = true, ordered by porcentaje descending
    const text = `
      SELECT 
        id, 
        nombre, 
        porcentaje 
      FROM "notarioElite".leyes
      WHERE ban_estudiar = true
      ORDER BY porcentaje DESC
    `;
    const result = await query(text);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching study laws:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
