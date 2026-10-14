import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../../db/database';
import { signedInCookie } from '../../../../access/test-session';
import { useTestDatabase } from '../../../../access/test-database';
import { PUT } from './route';

let cookie: string;

const edit = (body: object, id = 'a1', withCookie = true) =>
  PUT(
    new Request(`http://localhost/api/ideas/${id}`, {
      method: 'PUT',
      headers: withCookie ? { cookie } : {},
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
const valid = {
  title: 'Porch Light 2',
  summary: 'Updated.',
  category: 'Photography',
  score: 5,
  strengths: '',
  risks: '',
  nextStep: '',
  version: 1,
};
const row = (): Record<string, unknown> & { history: string[] } => {
  const db = openDatabase();
  const r = db.prepare('SELECT * FROM ideas WHERE id = ?').get('a1') as Record<string, unknown>;
  const history = db.prepare('SELECT description FROM status_history WHERE idea_id = ? ORDER BY id').all('a1') as { description: string }[];
  db.close();
  return { ...r, history: history.map((h) => h.description) };
};

function seed(fields: { status?: string; archivedAt?: number | null } = {}) {
  const db = openDatabase();
  db.prepare(
    `INSERT INTO ideas (id, capture_key, title, summary, category, score, status, logged_at, archived_at)
     VALUES ('a1', 'k1', 'Porch Light', 'A favour board.', 'Product', 9, ?, 1000, ?)`,
  ).run(fields.status ?? 'Logged', fields.archivedAt ?? null);
  db.close();
}

beforeEach(async () => {
  useTestDatabase();
  cookie = await signedInCookie();
});

describe('PUT /api/ideas/[id] (L2-013)', () => {
  it('Given valid changes, When saved, Then the idea is updated, the version increases and the idea is returned', async () => {
    seed();

    const res = await edit(valid);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ title: 'Porch Light 2', summary: 'Updated.', category: 'Photography', score: 5, version: 2 });
    expect(row()).toMatchObject({ title: 'Porch Light 2', category: 'Photography', score: 5, version: 2, status: 'Logged' });
  });

  it('Given an empty title or a bad score, When saved, Then 400 with inline errors and nothing is saved', async () => {
    seed();

    const res = await edit({ ...valid, title: '  ', score: 11 });

    expect(res.status).toBe(400);
    expect((await res.json()).errors).toEqual({ title: 'Enter a title for this idea', score: 'Enter a whole number from 1 to 10' });
    expect(row()).toMatchObject({ title: 'Porch Light', version: 1 });
  });

  it('Given no score, When saved, Then the score is cleared', async () => {
    seed();

    await edit({ ...valid, score: null });

    expect(row().score).toBeNull();
  });

  it('Given a Logged idea, When non-empty critique notes are saved, Then it becomes Critiquing with a history entry', async () => {
    seed();

    const res = await edit({ ...valid, strengths: 'Real need' });

    expect(await res.json()).toMatchObject({ status: 'Critiquing', strengths: 'Real need' });
    expect(row().history).toEqual(['Critiquing']);
  });

  it('Given a Logged idea, When empty critique notes are saved, Then it stays Logged', async () => {
    seed();

    await edit(valid);

    expect(row()).toMatchObject({ status: 'Logged', history: [] });
  });

  it('Given a Building idea, When critique notes are saved, Then its status does not change', async () => {
    seed({ status: 'Building' });

    await edit({ ...valid, risks: 'Trust' });

    expect(row()).toMatchObject({ status: 'Building', history: [] });
  });

  it('Given the idea changed since the dialog opened, When saved, Then 409 with the current idea and nothing is saved', async () => {
    seed();
    await edit(valid);

    const res = await edit({ ...valid, title: 'Stale' });

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ reason: 'changed', current: { title: 'Porch Light 2', version: 2 } });
    expect(row().title).toBe('Porch Light 2');
  });

  it('Given the idea changed, When saved with overwrite, Then the edit is applied', async () => {
    seed();
    await edit(valid);

    const res = await edit({ ...valid, title: 'Forced', overwrite: true });

    expect(res.status).toBe(200);
    expect(row()).toMatchObject({ title: 'Forced', version: 3 });
  });

  it('Given an archived idea, When edited, Then it is rejected and unchanged', async () => {
    seed({ archivedAt: 5000 });

    const res = await edit(valid);

    expect(res.status).toBe(422);
    expect((await res.json()).reason).toBe('archived');
    expect(row().title).toBe('Porch Light');
  });

  it('Given an unknown id, When edited, Then 404', async () => {
    expect((await edit(valid, 'nope')).status).toBe(404);
  });

  it('Given a signed-out visitor, When editing, Then 401', async () => {
    seed();

    expect((await edit(valid, 'a1', false)).status).toBe(401);
  });
});
