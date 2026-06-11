import { NextResponse } from 'next/server';

function getBaseUrl(request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = request.headers.get('host');
  
  // Preferir el host original que viene del proxy
  if (forwardedHost) {
    return `https://${forwardedHost}`;
  } else if (host && !host.includes('localhost')) {
    return `https://${host}`;
  }
  // Fallback a la ruta de producción si el host es localhost (por el proxy interno de Hostinger)
  return 'https://www.serenotario.com';
}

// Manejar redirecciones por GET (cuando Wompi hace redirect normal)
export async function GET(request) {
  return NextResponse.redirect(new URL('/planes', getBaseUrl(request)));
}

// Manejar redirecciones por POST (si Wompi hace redirect enviando data por POST)
export async function POST(request) {
  return NextResponse.redirect(new URL('/planes', getBaseUrl(request)), { status: 303 });
}
