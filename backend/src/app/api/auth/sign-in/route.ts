import { forbiddenOrigin, isSameOrigin } from '../../../../access/origin';
import { presentedSessionId, sessionCookie } from '../../../../access/session';
import { signIn } from '../../../../access/sign-in';
import { withErrorHandling } from '../../../../platform/with-error-handling';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request) => {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const body = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const errors: Record<string, string> = {};
  if (!email.trim()) errors.email = 'Enter your email';
  if (!password) errors.password = 'Enter your password';
  if (Object.keys(errors).length) {
    return Response.json({ status: 400, title: 'Check the form', errors }, { status: 400 });
  }

  const outcome = await signIn(email, password, presentedSessionId(request));
  if (!outcome) {
    return Response.json({ status: 401, title: 'Email or password is incorrect' }, { status: 401 });
  }
  return Response.json({}, { headers: { 'Set-Cookie': sessionCookie(outcome.sessionId) } });
});
