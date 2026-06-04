import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'notarioElite' AND table_name = 'usuario_nodos'`);
    const sample = await query(`SELECT * FROM "notarioElite".usuario_nodos LIMIT 5`);
    return NextResponse.json({ columns: result.rows, sample: sample.rows });
  } catch(e) {
    return NextResponse.json({ error: e.message });
  }
}
