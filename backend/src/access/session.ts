import { createHash, randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/database';
import type { SessionReader } from '../platform/with-owner-session';

const DAY = 24 * 60 * 60 * 1000;
const IDLE_LIMIT = 30 * DAY;
const MAX_AGE = 90 * DAY;
const COOKIE = 'cullr_session';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

export function createSession(db: DatabaseSync, userId: string, now = Date.now()): string {
  const id = newToken();
  db.prepare('INSERT INTO sessions (id_hash, user_id, created_at, last_used_at) VALUES (?, ?, ?, ?)').run(
    hashToken(id),
    userId,
    now,
    now,
  );
  return id;
}

export const sessionCookie = (id: string) =>
  `${COOKIE}=${id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE / 1000}`;

export const clearedSessionCookie = () =>
  `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

export function presentedSessionId(request: Request): string | null {
  const header = request.headers.get('cookie') ?? '';
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  return match ? match.slice(COOKIE.length + 1) || null : null;
}

export function destroySession(db: DatabaseSync, id: string): void {
  db.prepare('DELETE FROM sessions WHERE id_hash = ?').run(hashToken(id));
}

export const readSession: SessionReader = async (request) => {
  const id = presentedSessionId(request);
  if (!id) return null;
  const db = openDatabase();
  try {
    const row = db
      .prepare('SELECT user_id, created_at, last_used_at FROM sessions WHERE id_hash = ?')
      .get(hashToken(id)) as { user_id: string; created_at: number; last_used_at: number } | undefined;
    if (!row) return null;
    const now = Date.now();
    if (now - row.last_used_at >= IDLE_LIMIT || now - row.created_at >= MAX_AGE) {
      destroySession(db, id);
      return null;
    }
    db.prepare('UPDATE sessions SET last_used_at = ? WHERE id_hash = ?').run(now, hashToken(id));
    return { ownerId: row.user_id };
  } finally {
    db.close();
  }
};
