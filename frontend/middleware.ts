import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/teacher') || path.startsWith('/student')) {
    const sessionCookie = request.cookies.get('attendx_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const session = JSON.parse(sessionCookie.value);
      if (path.startsWith('/teacher') && session.role !== 'teacher') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (path.startsWith('/student') && session.role !== 'student') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*'],
};
