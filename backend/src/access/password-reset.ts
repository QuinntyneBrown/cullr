import { openDatabase } from '../db/database';
import { hashPassword } from './password';
import { hashToken, newToken } from './session';

const TOKEN_LIFETIME = 60 * 60 * 1000;

export function issueResetLink(email: string, now = Date.now()): string | null {
  const db = openDatabase();
  try {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase()) as
      | { id: string }
      | undefined;
    if (!user) return null;
    const token = newToken();
    db.prepare('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
      hashToken(token),
      user.id,
      now + TOKEN_LIFETIME,
    );
    return `${process.env.CULLR_BASE_URL ?? 'http://localhost:4200'}/reset-password?token=${token}`;
  } finally {
    db.close();
  }
}

export function isLinkUsable(token: string, now = Date.now()): boolean {
  const db = openDatabase();
  try {
    return usableUserId(db, token, now) !== null;
  } finally {
    db.close();
  }
}

function usableUserId(db: ReturnType<typeof openDatabase>, token: string, now: number): string | null {
  const row = db
    .prepare('SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
    .get(hashToken(token), now) as { user_id: string } | undefined;
  return row?.user_id ?? null;
}

export async function resetPassword(token: string, password: string, now = Date.now()): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  const db = openDatabase();
  try {
    db.exec('BEGIN');
    try {
      const userId = usableUserId(db, token, now);
      if (!userId) {
        db.exec('ROLLBACK');
        return false;
      }
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
      db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?').run(now, hashToken(token));
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
      db.exec('COMMIT');
      return true;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } finally {
    db.close();
  }
}
