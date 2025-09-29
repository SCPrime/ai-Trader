import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle maintenance mode.
 *
 * Set MAINTENANCE_MODE=true in Vercel env vars to enable.
 * Allows proxy API routes to function even during maintenance.
 */
export function middleware(request: NextRequest) {
  // Allow proxy API routes even during maintenance (for backend health checks)
  if (request.nextUrl.pathname.startsWith('/api/proxy')) {
    return NextResponse.next();
  }

  // If maintenance mode is enabled, return 503 for all other routes
  if (process.env.MAINTENANCE_MODE === 'true') {
    return new NextResponse(
      JSON.stringify({
        error: 'Under maintenance',
        message: 'The service is currently under maintenance. Please try again later.',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '300', // Suggest retry after 5 minutes
        },
      }
    );
  }

  return NextResponse.next();
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};