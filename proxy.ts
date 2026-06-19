import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  // Allow OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Missing or invalid authorization header' }),
      { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyJWT(token);

  if (!payload) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Invalid or expired token' }),
      { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }

  const requestHeaders = new Headers(request.headers);
  if (payload.userId) {
    requestHeaders.set('x-user-id', payload.userId as string);
  }
  if (payload.username) {
    requestHeaders.set('x-username', payload.username as string);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/api/scan-sku',
    '/api/scan-sku/:path*'
  ]
};
