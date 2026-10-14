import { forbiddenOrigin, isSameOrigin } from '../../../../access/origin';
import { clearedSessionCookie, destroySession, presentedSessionId } from '../../../../access/session';
import { openDatabase } from '../../../../db/database';
import { withErrorHandling } from '../../../../platform/with-error-handling';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request) => {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const id = presentedSessionId(request);
  if (id) {
    const db = openDatabase();
    try {
      destroySession(db, id);
    } finally {
      db.close();
    }
  }
  return Response.json({}, { headers: { 'Set-Cookie': clearedSessionCookie() } });
});
