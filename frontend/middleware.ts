import { NextRequest, NextResponse } from 'next/server';

// Auth is protected client-side in the dashboard layout using Supabase's
// browser session (localStorage). Server-side middleware cannot read localStorage,
// so we let all requests through and let the client handle redirects.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

