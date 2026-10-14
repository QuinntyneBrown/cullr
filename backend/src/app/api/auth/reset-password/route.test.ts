import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { openDatabase } from '../../../../db/database';
import { createOwner } from '../../../../access/owner';
import { useTestDatabase } from '../../../../access/test-database';
import { POST as signIn } from '../sign-in/route';
import { GET as currentSession } from '../session/route';
import { POST as forgot } from '../forgot-password/route';
import { GET as checkLink, POST as reset } from './route';

const OLD = 'correct horse battery';
const NEW = 'a brand new passphrase';

const post = (url: string, body: object) =>
  new Request(`http://localhost${url}`, { method: 'POST', body: JSON.stringify(body) });
const requestReset = (email = 'owner@cullr.app') => forgot(post('/api/auth/forgot-password', { email }));

let logged: string[];
beforeEach(async () => {
  useTestDatabase();
  await createOwner('owner@cullr.app', OLD);
  logged = [];
  vi.spyOn(console, 'log').mockImplementation((line: string) => void logged.push(String(line)));
});
afterEach(() => vi.restoreAllMocks());

const issuedToken = () => {
  const link = logged.map((l) => /reset-password\?token=([\w-]+)/.exec(l)?.[1]).find(Boolean);
  return link as string;
};

describe('POST /api/auth/forgot-password', () => {
  it('Given the owner email, When submitted, Then 200, exactly one link is logged and only a hash of its token is stored', async () => {
    const res = await requestReset();

    expect(res.status).toBe(200);
    expect(logged).toHaveLength(1);
    const token = issuedToken();
    expect(token).toBeTruthy();
    const db = openDatabase();
    const rows = db.prepare('SELECT token_hash, expires_at FROM password_reset_tokens').all() as {
      token_hash: string;
      expires_at: number;
    }[];
    db.close();
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(token);
    expect(rows[0].expires_at - Date.now()).toBeGreaterThan(59 * 60 * 1000);
    expect(rows[0].expires_at - Date.now()).toBeLessThanOrEqual(60 * 60 * 1000);
  });

  it('Given another well-formed email, When submitted, Then the same 200 response is returned and nothing is issued', async () => {
    const owner = await requestReset();
    logged = [];
    const other = await requestReset('someone@else.com');

    expect(other.status).toBe(200);
    expect(await other.json()).toEqual(await owner.json());
    expect(logged).toHaveLength(0);
  });

  it('Given a malformed or empty email, When submitted, Then 400 with an inline error', async () => {
    for (const email of ['', 'jordan@', 'no-at-sign']) {
      const res = await requestReset(email);
      expect(res.status).toBe(400);
      expect((await res.json()).errors.email).toBe('Enter an email address like name@example.com');
    }
  });
});

describe('reset password', () => {
  it('Given a fresh link, When it is checked, Then 200; an unknown token gets 410', async () => {
    await requestReset();

    const ok = await checkLink(new Request(`http://localhost/api/auth/reset-password?token=${issuedToken()}`));
    const bad = await checkLink(new Request('http://localhost/api/auth/reset-password?token=nope'));

    expect(ok.status).toBe(200);
    expect(bad.status).toBe(410);
  });

  it('Given a valid link and a policy-compliant password, When submitted, Then the password changes, the link is single-use and every session is revoked', async () => {
    const signedIn = await signIn(post('/api/auth/sign-in', { email: 'owner@cullr.app', password: OLD }));
    const cookie = signedIn.headers.get('set-cookie')!.split(';')[0];
    await requestReset();
    const token = issuedToken();

    const res = await reset(post('/api/auth/reset-password', { token, password: NEW }));

    expect(res.status).toBe(200);
    expect((await currentSession(new Request('http://localhost/s', { headers: { cookie } }))).status).toBe(401);
    expect((await signIn(post('/api/auth/sign-in', { email: 'owner@cullr.app', password: OLD }))).status).toBe(401);
    expect((await signIn(post('/api/auth/sign-in', { email: 'owner@cullr.app', password: NEW }))).status).toBe(200);
    const again = await reset(post('/api/auth/reset-password', { token, password: 'yet another passphrase' }));
    expect(again.status).toBe(410);
    expect((await checkLink(new Request(`http://localhost/api/auth/reset-password?token=${token}`))).status).toBe(410);
  });

  it('Given a password that breaks the policy, When submitted, Then 400 with the reason and the link is still usable', async () => {
    await requestReset();
    const token = issuedToken();

    const short = await reset(post('/api/auth/reset-password', { token, password: 'short' }));
    const common = await reset(post('/api/auth/reset-password', { token, password: 'Password1234' }));

    expect((await short.json()).errors.password).toBe('Use at least 12 characters');
    expect((await common.json()).errors.password).toBe('That password is too common');
    expect((await reset(post('/api/auth/reset-password', { token, password: NEW }))).status).toBe(200);
  });

  it('Given an expired link, When opened or submitted, Then 410', async () => {
    await requestReset();
    const token = issuedToken();
    const db = openDatabase();
    db.prepare('UPDATE password_reset_tokens SET expires_at = ?').run(Date.now() - 1);
    db.close();

    expect((await checkLink(new Request(`http://localhost/api/auth/reset-password?token=${token}`))).status).toBe(410);
    expect((await reset(post('/api/auth/reset-password', { token, password: NEW }))).status).toBe(410);
  });

  it('Given logs, When a link is issued and used, Then no password appears in them', async () => {
    await requestReset();
    await reset(post('/api/auth/reset-password', { token: issuedToken(), password: NEW }));

    expect(logged.join('\n')).not.toContain(NEW);
  });
});
