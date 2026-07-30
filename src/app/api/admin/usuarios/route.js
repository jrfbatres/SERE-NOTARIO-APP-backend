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
    const fecha = searchParams.get('fecha'); // Expect YYYY-MM-DD

    let sql = `
      SELECT 
        u.id,
        u.nombre,
        u.correo,
        u.rol,
        u.creado_en,
        u.fecha_vence,
        u.ban_plan,
        u.ban_fundador,
        EXISTS(SELECT 1 FROM public.usuario_pagos WHERE usuario_id = u.id) AS tiene_link,
        COALESCE((SELECT COUNT(*) FROM "notarioElite".usuario_nodos WHERE usuario_id = u.id AND completado = true), 0) AS nodos_completados
      FROM "notarioElite".usuarios u
    `;
    const params = [];

    if (fecha) {
      sql += ` WHERE u.creado_en::date = $1`;
      params.push(fecha);
    }

    sql += ` ORDER BY u.creado_en DESC`;

    const result = await query(sql, params);
    
    const now = new Date();
    const formattedData = result.rows.map(user => {
      let computedRol = user.rol || 'Estándar';
      
      if (user.correo === 'admin@serenotario.com' || user.rol === 'Administrador' || user.rol === 'ADMINISTRADOR') {
        computedRol = 'ADMINISTRADOR';
      } else if (!user.fecha_vence) {
        computedRol = 'DEMOS';
      } else if (new Date(user.fecha_vence) < now) {
        computedRol = 'VENCIDO';
      } else {
        if (user.ban_fundador) {
          computedRol = 'FUNDADOR';
        } else if (user.ban_plan === 'C' || user.ban_plan === 'c') {
          computedRol = 'PREMIUN';
        } else if (user.ban_plan === 'P' || user.ban_plan === 'p') {
          computedRol = 'PROFUNDO';
        } else if (user.ban_plan === 'B' || user.ban_plan === 'b') {
          computedRol = 'LITE';
        }
      }
      
      return {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        creado_en: user.creado_en,
        tiene_link: user.tiene_link,
        nodos_completados: user.nodos_completados,
        rol: computedRol
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching admin users report:', error);
    return NextResponse.json({ error: 'Error interno del servidor', message: error.message }, { status: 500 });
  }
}
