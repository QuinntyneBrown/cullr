import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../db/database';
import { signedInCookie } from '../../../access/test-session';
import { useTestDatabase } from '../../../access/test-database';
import { POST } from './route';

let cookie: string;

const curate = (body: unknown, withCookie = true) =>
  POST(
    new Request('http://localhost/api/curation', {
      method: 'POST',
      headers: withCookie ? { cookie } : {},
      body: JSON.stringify(body),
    }),
  );

function seed(id: string, fields: { status?: string; archivedAt?: number | null } = {}) {
  const db = openDatabase();
  db.prepare(
    `INSERT INTO ideas (id, capture_key, title, summary, category, status, logged_at, archived_at)
     VALUES (?, ?, ?, '', 'Product', ?, 1000, ?)`,
  ).run(id, `k-${id}`, `Idea ${id}`, fields.status ?? 'Logged', fields.archivedAt ?? null);
  db.close();
}
const entries = (period = 'today') => {
  const db = openDatabase();
  const rows = db
    .prepare('SELECT idea_id FROM best_of_entries WHERE period = ? AND ended_at IS NULL ORDER BY curated_at, id')
    .all(period) as { idea_id: string }[];
  db.close();
  return rows.map((r) => r.idea_id);
};
const ideaState = (id: string) => {
  const db = openDatabase();
  const idea = db.prepare('SELECT status FROM ideas WHERE id = ?').get(id) as { status: string };
  const history = db.prepare('SELECT description FROM status_history WHERE idea_id = ?').all(id) as { description: string }[];
  db.close();
  return { status: idea.status, history: history.map((h) => h.description) };
};

beforeEach(async () => {
  useTestDatabase();
  cookie = await signedInCookie();
});

describe('POST /api/curation (L2-015)', () => {
  it('Given an active idea, When curated into a period, Then it is best of that period and moves to Curating', async () => {
    seed('a1');

    const res = await curate({ ideaIds: ['a1'], period: 'week' });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ period: 'week', curated: [{ id: 'a1', title: 'Idea a1' }], alreadyBest: [], displaced: [] });
    expect(entries('week')).toEqual(['a1']);
    expect(ideaState('a1')).toEqual({ status: 'Curating', history: ['Curating'] });
  });

  it('Given an idea already Building, When curated, Then its status is unchanged', async () => {
    seed('a1', { status: 'Building' });

    await curate({ ideaIds: ['a1'], period: 'today' });

    expect(ideaState('a1')).toEqual({ status: 'Building', history: [] });
  });

  it('Given an archived idea, When curated, Then 422 and nothing changes', async () => {
    seed('a1', { archivedAt: 5000 });

    const res = await curate({ ideaIds: ['a1'], period: 'today' });

    expect(res.status).toBe(422);
    expect(entries()).toEqual([]);
  });

  it('Given an unknown idea, When curated, Then 404', async () => {
    expect((await curate({ ideaIds: ['nope'], period: 'today' })).status).toBe(404);
  });

  it('Given an unknown period or no ideas, When curated, Then 400', async () => {
    seed('a1');

    expect((await curate({ ideaIds: ['a1'], period: 'decade' })).status).toBe(400);
    expect((await curate({ ideaIds: [], period: 'today' })).status).toBe(400);
  });

  it('Given a signed-out visitor, When curating, Then 401', async () => {
    seed('a1');

    expect((await curate({ ideaIds: ['a1'], period: 'today' }, false)).status).toBe(401);
  });
});

describe('POST /api/curation limits (L2-015)', () => {
  it('Given the idea is already best of the period, When curated again, Then nothing changes and it is reported', async () => {
    seed('a1');
    await curate({ ideaIds: ['a1'], period: 'today' });

    const res = await curate({ ideaIds: ['a1'], period: 'today' });

    expect(await res.json()).toMatchObject({ curated: [], alreadyBest: [{ id: 'a1' }], displaced: [] });
    expect(entries()).toEqual(['a1']);
  });

  it('Given an idea best of today, When curated into the week, Then it is best of both', async () => {
    seed('a1');
    await curate({ ideaIds: ['a1'], period: 'today' });
    await curate({ ideaIds: ['a1'], period: 'week' });

    expect(entries('today')).toEqual(['a1']);
    expect(entries('week')).toEqual(['a1']);
  });

  it('Given the period holds 5, When another is curated, Then the earliest curated is displaced and named', async () => {
    for (const id of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']) seed(id);
    for (const id of ['a1', 'a2', 'a3', 'a4', 'a5']) await curate({ ideaIds: [id], period: 'today' });

    const res = await curate({ ideaIds: ['a6'], period: 'today' });

    expect(await res.json()).toMatchObject({ curated: [{ id: 'a6' }], displaced: [{ id: 'a1', title: 'Idea a1' }] });
    expect(entries()).toEqual(['a2', 'a3', 'a4', 'a5', 'a6']);
  });

  it('Given several ideas, When curated together, Then the limit applies to the period as a whole', async () => {
    for (const id of ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'b2']) seed(id);
    for (const id of ['a1', 'a2', 'a3', 'a4', 'a5']) await curate({ ideaIds: [id], period: 'month' });

    const res = await curate({ ideaIds: ['b1', 'b2'], period: 'month' });

    expect((await res.json()).displaced.map((d: { id: string }) => d.id)).toEqual(['a1', 'a2']);
    expect(entries('month')).toEqual(['a3', 'a4', 'a5', 'b1', 'b2']);
  });

  it('Given an archived idea among several, When curated together, Then none are curated', async () => {
    seed('a1');
    seed('a2', { archivedAt: 5000 });

    expect((await curate({ ideaIds: ['a1', 'a2'], period: 'today' })).status).toBe(422);
    expect(entries()).toEqual([]);
  });

  it('Given more than 5 ideas, When curated together, Then 400', async () => {
    const ids = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
    ids.forEach((id) => seed(id));

    expect((await curate({ ideaIds: ids, period: 'today' })).status).toBe(400);
  });

  it('Given a best-of entry from a previous period, When curated now, Then the lapsed entry does not count', async () => {
    seed('a1');
    const db = openDatabase();
    db.prepare("INSERT INTO best_of_entries (idea_id, period, curated_at) VALUES ('a1', 'today', 1000)").run();
    db.close();

    const res = await curate({ ideaIds: ['a1'], period: 'today' });

    expect(await res.json()).toMatchObject({ curated: [{ id: 'a1' }], alreadyBest: [] });
  });
});
