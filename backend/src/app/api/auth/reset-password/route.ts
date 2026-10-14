import { forbiddenOrigin, isSameOrigin } from '../../../../access/origin';
import { checkPasswordPolicy } from '../../../../access/password';
import { isLinkUsable, resetPassword } from '../../../../access/password-reset';
import { withErrorHandling } from '../../../../platform/with-error-handling';

export const dynamic = 'force-dynamic';

const linkInvalid = () =>
  Response.json({ status: 410, title: 'This reset link is no longer valid' }, { status: 410 });

export const GET = withErrorHandling(async (request) => {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  return isLinkUsable(token) ? Response.json({}) : linkInvalid();
});

export const POST = withErrorHandling(async (request) => {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const body = (await request.json().catch(() => ({}))) as { token?: unknown; password?: unknown };
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const reason = checkPasswordPolicy(password);
  if (reason) {
    return Response.json(
      { status: 400, title: 'Check the form', errors: { password: reason } },
      { status: 400 },
    );
  }
  return (await resetPassword(token, password)) ? Response.json({}) : linkInvalid();
});
