import { NextRequest, NextResponse } from 'next/server';

// Vercel middleware - handles all incoming requests
export function middleware(request: NextRequest) {
  // Handle all requests
  const response = NextResponse.next();
  
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: '/:path*',
};
