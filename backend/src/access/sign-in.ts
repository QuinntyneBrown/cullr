import { openDatabase } from '../db/database';
import { verifyPassword } from './password';
import { createSession, destroySession } from './session';

const WINDOW = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export type SignInOutcome = { sessionId: string } | null;

export async function signIn(
  email: string,
  password: string,
  presentedSession: string | null,
  now = Date.now(),
): Promise<SignInOutcome> {
  const db = openDatabase();
  try {
    const user = db
      .prepare('SELECT id, password_hash FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as { id: string; password_hash: string } | undefined;
    if (!user) return null;

    const { n } = db
      .prepare('SELECT count(*) AS n FROM failed_sign_ins WHERE user_id = ? AND at > ?')
      .get(user.id, now - WINDOW) as { n: number };
    if (n >= MAX_FAILURES) return null;

    if (!(await verifyPassword(password, user.password_hash))) {
      db.prepare('INSERT INTO failed_sign_ins (user_id, at) VALUES (?, ?)').run(user.id, now);
      return null;
    }

    db.prepare('DELETE FROM failed_sign_ins WHERE user_id = ?').run(user.id);
    if (presentedSession) destroySession(db, presentedSession);
    return { sessionId: createSession(db, user.id, now) };
  } finally {
    db.close();
  }
}
