import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../../db/database';
import { signedInCookie } from '../../../../access/test-session';
import { useTestDatabase } from '../../../../access/test-database';
import { getCurated } from '../../../../curation/view-curated/get-curated';
import { GET } from './route';

let cookie: string;

function seed(id: string, fields: { title?: string; category?: string; score?: number | null; archivedAt?: number | null } = {}) {
  const db = openDatabase();
  db.prepare(
    `INSERT INTO ideas (id, capture_key, title, summary, category, score, status, logged_at, archived_at)
     VALUES (?, ?, ?, 'summary', ?, ?, 'Curating', 1000, ?)`,
  ).run(id, `k-${id}`, fields.title ?? `Idea ${id}`, fields.category ?? 'Product', fields.score ?? null, fields.archivedAt ?? null);
  db.close();
}
function entry(ideaId: string, period: string, curatedAt: number, endedAt: number | null = null) {
  const db = openDatabase();
  db.prepare('INSERT INTO best_of_entries (idea_id, period, curated_at, ended_at) VALUES (?, ?, ?, ?)').run(ideaId, period, curatedAt, endedAt);
  db.close();
}
const get = (withCookie = true) => GET(new Request('http://localhost/api/curation/curated', { headers: withCookie ? { cookie } : {} }));

// Wed 2026-10-14 11:00 in Toronto (UTC-4)
const NOW = Date.UTC(2026, 9, 14, 15, 0);
const hours = (h: number) => h * 3600 * 1000;

beforeEach(async () => {
  useTestDatabase();
  cookie = await signedInCookie();
});

describe('GET /api/curation/curated (L2-016)', () => {
  it('Given a signed-out visitor, When requested, Then 401', async () => {
    expect((await get(false)).status).toBe(401);
  });

  it('Given no best-of ideas, When requested, Then the list is empty', async () => {
    expect(await (await get()).json()).toMatchObject({ items: [], distinctIdeaCount: 0 });
  });

  it('Given best-of ideas, When viewed, Then periods are ordered today to year and ideas by score with unscored last', () => {
    seed('a', { score: 3 });
    seed('b', { score: 9 });
    seed('c');
    seed('d', { score: 5 });
    entry('d', 'year', NOW - hours(1));
    entry('c', 'today', NOW - hours(1));
    entry('a', 'today', NOW - hours(2));
    entry('b', 'today', NOW - hours(3));
    entry('b', 'week', NOW - hours(3));

    const list = getCurated(NOW);

    expect(list.items.map((i) => `${i.period}:${i.idea.id}`)).toEqual(['today:b', 'today:a', 'today:c', 'week:b', 'year:d']);
    expect(list.distinctIdeaCount).toBe(4);
    expect(list.items[0].idea).toMatchObject({ title: 'Idea b', summary: 'summary', category: 'Product', status: 'Curating', score: 9 });
    expect(list.asOf).toBe('2026-10-14');
  });

  it('Given a best-of-today idea from yesterday, When viewed, Then it has lapsed but a still-current week entry remains (L2-017)', () => {
    seed('a');
    entry('a', 'today', NOW - hours(30));
    entry('a', 'week', NOW - hours(30));

    expect(getCurated(NOW).items.map((i) => i.period)).toEqual(['week']);
  });

  it('Given the week ended on Sunday, When viewed on Monday, Then last week entries have lapsed', () => {
    seed('a');
    seed('b');
    entry('a', 'week', Date.UTC(2026, 9, 11, 20, 0)); // Sunday 16:00 Toronto
    entry('b', 'week', Date.UTC(2026, 9, 12, 14, 0)); // Monday 10:00 Toronto

    const items = getCurated(Date.UTC(2026, 9, 12, 15, 0)).items;

    expect(items.map((i) => i.idea.id)).toEqual(['b']);
  });

  it('Given the month and year ended, When viewed in the next, Then those entries have lapsed', () => {
    seed('a');
    seed('b');
    entry('a', 'month', Date.UTC(2026, 8, 20, 12, 0));
    entry('b', 'year', Date.UTC(2025, 11, 20, 12, 0));

    expect(getCurated(NOW).items).toEqual([]);
  });

  it('Given displaced and archived ideas, When viewed, Then they are not listed', () => {
    seed('a');
    seed('b', { archivedAt: 5000 });
    entry('a', 'today', NOW - hours(1), NOW - hours(1));
    entry('b', 'today', NOW - hours(1));

    expect(getCurated(NOW).items).toEqual([]);
  });
});
