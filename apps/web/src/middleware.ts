import { NextResponse, NextRequest } from 'next/server';

// Resolve tenant from host (e.g., acme.sniffrpack.com) or ?tenant= param for dev.
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const explicit = url.searchParams.get('tenant');
  const host = req.headers.get('host') || '';
  const sub = host.split('.')[0]; // naive subdomain -> "acme"

  // prefer explicit param in preview/dev
  const tenant = explicit || sub;

  const res = NextResponse.next();
  if (tenant) res.headers.set('x-tenant', tenant);
  return res;
}

export const config = {
  matcher: ['/((?!_next|api|static|.*\\..*).*)'],
};
