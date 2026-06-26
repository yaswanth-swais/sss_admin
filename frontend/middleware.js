import { NextResponse } from 'next/server';

// Temporarily disable middleware for testing
export function middleware(request) {
  // Allow all access - no redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
