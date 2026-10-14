// Equivalent origin check for state-changing requests (L2-041): a browser-sent Origin must match the host.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const forbiddenOrigin = () =>
  Response.json({ status: 403, title: 'Request not allowed' }, { status: 403 });
