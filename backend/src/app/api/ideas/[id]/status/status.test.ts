import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../../../db/database';
import { signedInCookie } from '../../../../../access/test-session';
import { useTestDatabase } from '../../../../../access/test-database';
import { PUT } from './route';

let cookie: string;

const setStatus = (status: string, id = 'a1', withCookie = true) =>
  PUT(
    new Request(`http://localhost/api/ideas/${id}/status`, {
      method: 'PUT',
      headers: withCookie ? { cookie } : {},
      body: JSON.stringify({ status }),
    }),
    { params: Promise.resolve({ id }) },
  );
const state = () => {
  const db = openDatabase();
  const idea = db.prepare('SELECT status, version FROM ideas WHERE id = ?').get('a1') as { status: string; version: number };
  const history = db.prepare('SELECT description FROM status_history WHERE idea_id = ?').all('a1') as { description: string }[];
  db.close();
  return { ...idea, history: history.map((h) => h.description) };
};

function seed(fields: { status?: string; archivedAt?: number | null } = {}) {
  const db = openDatabase();
  db.prepare(
    `INSERT INTO ideas (id, capture_key, title, summary, category, status, logged_at, archived_at)
     VALUES ('a1', 'k1', 'Porch Light', '', 'Product', ?, 1000, ?)`,
  ).run(fields.status ?? 'Curating', fields.archivedAt ?? null);
  db.close();
}

beforeEach(async () => {
  useTestDatabase();
  cookie = await signedInCookie();
});

describe('PUT /api/ideas/[id]/status (L2-052)', () => {
  it('Given an active idea, When set to Building or Built, Then the status changes and a history entry is added', async () => {
    seed();

    const res = await setStatus('Building');

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'Building', history: [{ description: 'Building' }] });
    expect((await setStatus('Built')).status).toBe(200);
    expect(state()).toMatchObject({ status: 'Built', history: ['Building', 'Built'] });
  });

  it('Given the idea already has the status, When it is chosen, Then nothing changes and no entry is added', async () => {
    seed({ status: 'Building' });

    const res = await setStatus('Building');

    expect(res.status).toBe(200);
    expect(state()).toEqual({ status: 'Building', version: 1, history: [] });
  });

  it('Given a status other than Building or Built, When set, Then 400', async () => {
    seed();

    expect((await setStatus('Logged')).status).toBe(400);
    expect(state().status).toBe('Curating');
  });

  it('Given an archived idea, When set, Then it is rejected and unchanged', async () => {
    seed({ archivedAt: 5000 });

    const res = await setStatus('Building');

    expect(res.status).toBe(422);
    expect(state()).toMatchObject({ status: 'Curating', history: [] });
  });

  it('Given an unknown id, When set, Then 404', async () => {
    expect((await setStatus('Building', 'nope')).status).toBe(404);
  });

  it('Given a signed-out visitor, When setting, Then 401', async () => {
    seed();

    expect((await setStatus('Building', 'a1', false)).status).toBe(401);
  });
});
