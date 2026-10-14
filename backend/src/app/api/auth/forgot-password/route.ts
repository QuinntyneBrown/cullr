import { forbiddenOrigin, isSameOrigin } from '../../../../access/origin';
import { issueResetLink } from '../../../../access/password-reset';
import { withErrorHandling } from '../../../../platform/with-error-handling';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request) => {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { status: 400, title: 'Check the form', errors: { email: 'Enter an email address like name@example.com' } },
      { status: 400 },
    );
  }

  // No email provider yet: the link goes to the server console.
  const link = issueResetLink(email);
  if (link) console.log(JSON.stringify({ level: 'info', event: 'password-reset-link', link }));
  return Response.json({});
});
