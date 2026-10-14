import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../db/database';
import { signedInCookie } from '../../../access/test-session';
import { useTestDatabase } from '../../../access/test-database';
import { POST } from './route';

let cookie: string;

const capture = (body: object, withCookie = true) =>
  POST(
    new Request('http://localhost/api/ideas', {
      method: 'POST',
      headers: withCookie ? { cookie } : {},
      body: JSON.stringify(body),
    }),
  );
const valid = { captureKey: 'key-1', title: 'Porch Light', summary: 'A favour board.', category: 'Product', score: 7 };
const rows = () => {
  const db = openDatabase();
  const all = db.prepare('SELECT * FROM ideas').all() as Record<string, unknown>[];
  db.close();
  return all;
};

beforeEach(async () => {
  useTestDatabase();
  cookie = await signedInCookie();
});

describe('POST /api/ideas (L2-006, L2-007)', () => {
  it('Given a valid idea, When captured, Then it is saved as Logged with the logged time set to now and returned', async () => {
    const before = Date.now();

    const res = await capture(valid);

    expect(res.status).toBe(201);
    const idea = await res.json();
    expect(idea).toMatchObject({ title: 'Porch Light', summary: 'A favour board.', category: 'Product', score: 7, status: 'Logged' });
    expect(idea.loggedAt).toBeGreaterThanOrEqual(before);
    expect(rows()).toHaveLength(1);
  });

  it('Given no score, When captured, Then the idea is saved without a score', async () => {
    const res = await capture({ ...valid, score: null });

    expect((await res.json()).score).toBeNull();
    expect(rows()[0].score).toBeNull();
  });

  it('Given a signed-out visitor, When capturing, Then 401 and nothing is saved', async () => {
    const res = await capture(valid, false);

    expect(res.status).toBe(401);
    expect(rows()).toHaveLength(0);
  });

  it('Given an empty or whitespace-only title, When captured, Then the title error is returned and nothing is saved', async () => {
    const res = await capture({ ...valid, title: '   ' });

    expect(res.status).toBe(400);
    expect((await res.json()).errors).toEqual({ title: 'Enter a title for this idea' });
    expect(rows()).toHaveLength(0);
  });

  it('Given text over the limits, When captured, Then it is rejected', async () => {
    expect((await capture({ ...valid, title: 'x'.repeat(121) })).status).toBe(400);
    expect((await capture({ ...valid, summary: 'x'.repeat(1001) })).status).toBe(400);
    expect((await capture({ ...valid, title: 'x'.repeat(120), summary: 'x'.repeat(1000) })).status).toBe(201);
  });

  it.each([0, 11, 5.5, 'abc'])('Given the score %s, When captured, Then the score error is returned and nothing is saved', async (score) => {
    const res = await capture({ ...valid, score });

    expect(res.status).toBe(400);
    expect((await res.json()).errors).toEqual({ score: 'Enter a whole number from 1 to 10' });
    expect(rows()).toHaveLength(0);
  });

  it('Given an unknown category, When captured, Then it is rejected', async () => {
    expect((await capture({ ...valid, category: 'Cooking' })).status).toBe(400);
  });

  it('Given the same capture request delivered twice, When both reach the server, Then exactly one idea exists and both answers carry it', async () => {
    const [first, second] = await Promise.all([capture(valid), capture(valid)]);

    expect((await first.json()).id).toBe((await second.json()).id);
    expect(rows()).toHaveLength(1);
  });

  it('Given two different capture requests with equal text, When captured, Then two ideas exist', async () => {
    await capture(valid);
    await capture({ ...valid, captureKey: 'key-2' });

    expect(rows()).toHaveLength(2);
  });
});
