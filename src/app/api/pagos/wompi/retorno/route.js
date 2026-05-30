import { NextResponse } from 'next/server';

// Manejar redirecciones por GET (cuando Wompi hace redirect normal)
export async function GET(request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/planes', url.origin));
}

// Manejar redirecciones por POST (si Wompi hace redirect enviando data por POST)
export async function POST(request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/planes', url.origin), { status: 303 });
}
