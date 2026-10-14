import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../../db/database';
import { createOwner } from '../../../../access/owner';
import { useTestDatabase } from '../../../../access/test-database';
import { withOwnerSession } from '../../../../platform/with-owner-session';
import { POST as signIn } from '../sign-in/route';
import { POST as signOut } from '../sign-out/route';
import { GET as currentSession } from './route';

const PASSWORD = 'correct horse battery';
const DAY = 24 * 60 * 60 * 1000;

async function signedInCookie(): Promise<string> {
  const res = await signIn(
    new Request('http://localhost/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email: 'owner@cullr.app', password: PASSWORD }),
    }),
  );
  return res.headers.get('set-cookie')!.split(';')[0];
}
const get = (cookie?: string) =>
  currentSession(new Request('http://localhost/api/auth/session', { headers: cookie ? { cookie } : {} }));

beforeEach(async () => {
  useTestDatabase();
  await createOwner('owner@cullr.app', PASSWORD);
});

describe('session', () => {
  it('Given a signed-in owner, When the session is read, Then 200', async () => {
    const res = await get(await signedInCookie());

    expect(res.status).toBe(200);
  });

  it('Given a signed-out visitor, When a protected API is called, Then 401 and no data is returned', async () => {
    const res = await get();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ status: 401, title: 'Sign in required' });
  });

  it('Given the real session reader, When withOwnerSession guards an endpoint, Then a signed-in request reaches it and an anonymous one does not', async () => {
    const guarded = withOwnerSession(async () => Response.json({ ideas: [] }));
    const cookie = await signedInCookie();

    expect((await guarded(new Request('http://localhost/x', { headers: { cookie } }))).status).toBe(200);
    expect((await guarded(new Request('http://localhost/x'))).status).toBe(401);
  });

  it('Given a session idle for 30 days, When any request is made, Then it is rejected', async () => {
    const cookie = await signedInCookie();
    const db = openDatabase();
    db.prepare('UPDATE sessions SET last_used_at = last_used_at - ?').run(30 * DAY);
    db.close();

    expect((await get(cookie)).status).toBe(401);
  });

  it('Given a session older than 90 days that is still in use, When any request is made, Then it is rejected', async () => {
    const cookie = await signedInCookie();
    const db = openDatabase();
    db.prepare('UPDATE sessions SET created_at = created_at - ?').run(90 * DAY);
    db.close();

    expect((await get(cookie)).status).toBe(401);
  });

  it('Given a session used 29 days ago, When a request is made, Then it is accepted', async () => {
    const cookie = await signedInCookie();
    const db = openDatabase();
    db.prepare('UPDATE sessions SET last_used_at = last_used_at - ?').run(29 * DAY);
    db.close();

    expect((await get(cookie)).status).toBe(200);
  });
});

describe('POST /api/auth/sign-out', () => {
  it('Given a signed-in owner, When signing out, Then the session is deleted server-side, the cookie is cleared and the old cookie no longer works', async () => {
    const cookie = await signedInCookie();

    const res = await signOut(
      new Request('http://localhost/api/auth/sign-out', { method: 'POST', headers: { cookie } }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
    const db = openDatabase();
    const { n } = db.prepare('SELECT count(*) AS n FROM sessions').get() as { n: number };
    db.close();
    expect(n).toBe(0);
    expect((await get(cookie)).status).toBe(401);
  });

  it('Given a cross-origin request, When signing out, Then it is rejected with 403 and the session survives', async () => {
    const cookie = await signedInCookie();

    const res = await signOut(
      new Request('http://localhost/api/auth/sign-out', {
        method: 'POST',
        headers: { cookie, origin: 'https://evil.example' },
      }),
    );

    expect(res.status).toBe(403);
    expect((await get(cookie)).status).toBe(200);
  });
});
