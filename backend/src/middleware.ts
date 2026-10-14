import { NextRequest, NextResponse } from 'next/server';

const headers: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function middleware(request: NextRequest): NextResponse {
  if (request.headers.get('x-forwarded-proto') === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return withHeaders(NextResponse.redirect(url, 308));
  }
  return withHeaders(NextResponse.next());
}

function withHeaders(response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}
