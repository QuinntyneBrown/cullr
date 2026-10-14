import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

describe('security middleware', () => {
  it('Given a request over HTTP, When it arrives behind the proxy, Then it is redirected to HTTPS', () => {
    const res = middleware(
      new NextRequest('http://cullr.example/api/health', { headers: { 'x-forwarded-proto': 'http' } }),
    );

    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://cullr.example/api/health');
  });

  it('Given any response, When it is sent, Then it carries the security headers', () => {
    const res = middleware(
      new NextRequest('https://cullr.example/api/health', { headers: { 'x-forwarded-proto': 'https' } }),
    );

    expect(res.headers.get('strict-transport-security')).toContain('max-age=');
    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });
});
