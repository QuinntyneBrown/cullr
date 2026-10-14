import { openDatabase } from '../../../../db/database';
import { withErrorHandling } from '../../../../platform/with-error-handling';
import { withOwnerSession } from '../../../../platform/with-owner-session';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(
  withOwnerSession(async (request, owner) => {
    const db = openDatabase();
    try {
      const row = db.prepare('SELECT email FROM users WHERE id = ?').get(owner.ownerId) as { email: string };
      return Response.json({ email: row.email });
    } finally {
      db.close();
    }
  }),
);
