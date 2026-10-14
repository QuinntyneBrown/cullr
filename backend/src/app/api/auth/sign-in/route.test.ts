import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../../db/database';
import { createOwner } from '../../../../access/owner';
import { useTestDatabase } from '../../../../access/test-database';
import { POST } from './route';

const PASSWORD = 'correct horse battery';
const signIn = (body: object, headers: Record<string, string> = {}) =>
  POST(
    new Request('http://localhost/api/auth/sign-in', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  );

beforeEach(async () => {
  useTestDatabase();
  await createOwner('owner@cullr.app', PASSWORD);
});

describe('POST /api/auth/sign-in', () => {
  it('Given the owner credentials, When submitted, Then 200 and a Secure HttpOnly SameSite=Lax session cookie whose id is stored only as a hash', async () => {
    const res = await signIn({ email: 'owner@cullr.app', password: PASSWORD });

    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toMatch(/^cullr_session=[^;]+/);
    for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) {
      expect(cookie).toContain(attribute);
    }
    const id = /cullr_session=([^;]+)/.exec(cookie)![1];
    const db = openDatabase();
    const rows = db.prepare('SELECT id_hash FROM sessions').all() as { id_hash: string }[];
    db.close();
    expect(rows).toHaveLength(1);
    expect(rows[0].id_hash).not.toBe(id);
  });

  it('Given a wrong password or an unknown email, When submitted, Then both get the same generic 401', async () => {
    const wrongPassword = await signIn({ email: 'owner@cullr.app', password: 'not the password' });
    const unknownEmail = await signIn({ email: 'who@cullr.app', password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    const body = await wrongPassword.json();
    expect(body.title).toBe('Email or password is incorrect');
    expect(body).toEqual(await unknownEmail.json());
    expect(wrongPassword.headers.get('set-cookie')).toBeNull();
  });

  it('Given an empty email or password, When submitted, Then 400 with field errors and no session', async () => {
    const res = await signIn({ email: '', password: '' });

    expect(res.status).toBe(400);
    expect((await res.json()).errors).toEqual({ email: 'Enter your email', password: 'Enter your password' });
  });

  it('Given a signed-in owner signs in again, When the cookie is presented, Then the identifier is regenerated and the old session is gone', async () => {
    const first = await signIn({ email: 'owner@cullr.app', password: PASSWORD });
    const oldCookie = first.headers.get('set-cookie')!.split(';')[0];
    const second = await signIn(
      { email: 'owner@cullr.app', password: PASSWORD },
      { cookie: oldCookie },
    );

    expect(second.headers.get('set-cookie')!.split(';')[0]).not.toBe(oldCookie);
    const db = openDatabase();
    const count = (db.prepare('SELECT count(*) AS n FROM sessions').get() as { n: number }).n;
    db.close();
    expect(count).toBe(1);
  });

  it('Given a request from another origin, When submitted, Then it is rejected with 403 and signs nobody in', async () => {
    const res = await signIn(
      { email: 'owner@cullr.app', password: PASSWORD },
      { origin: 'https://evil.example' },
    );

    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
  });
});

describe('sign-in lockout', () => {
  const fail = () => signIn({ email: 'owner@cullr.app', password: 'not the password' });

  it('Given 5 failed sign-ins, When a sixth is made, Then it is rejected with the same generic message even with the correct password', async () => {
    for (let i = 0; i < 5; i++) await fail();

    const res = await signIn({ email: 'owner@cullr.app', password: PASSWORD });

    expect(res.status).toBe(401);
    expect((await res.json()).title).toBe('Email or password is incorrect');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('Given 4 failures, When the correct password is used, Then the owner signs in and the failure count resets', async () => {
    for (let i = 0; i < 4; i++) await fail();
    expect((await signIn({ email: 'owner@cullr.app', password: PASSWORD })).status).toBe(200);
    for (let i = 0; i < 4; i++) await fail();

    expect((await signIn({ email: 'owner@cullr.app', password: PASSWORD })).status).toBe(200);
  });

  it('Given 5 failures older than 15 minutes, When the owner signs in, Then it succeeds', async () => {
    for (let i = 0; i < 5; i++) await fail();
    const db = openDatabase();
    db.prepare('UPDATE failed_sign_ins SET at = at - ?').run(16 * 60 * 1000);
    db.close();

    expect((await signIn({ email: 'owner@cullr.app', password: PASSWORD })).status).toBe(200);
  });
});
