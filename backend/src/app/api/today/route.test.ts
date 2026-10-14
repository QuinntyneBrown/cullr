import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../db/database';
import { signedInCookie } from '../../../access/test-session';
import { useTestDatabase } from '../../../access/test-database';
import { getTodaySummary } from '../../../ideas/today-summary/today-summary';
import { GET } from './route';

let cookie: string;
let n = 0;

function seed(fields: { loggedAt: number; title?: string; category?: string; score?: number | null; curatedAt?: number | null; archivedAt?: number | null }) {
  const db = openDatabase();
  db.prepare(
    `INSERT INTO ideas (id, capture_key, title, summary, category, score, status, logged_at, archived_at)
     VALUES (?, ?, ?, 'summary', ?, ?, 'Logged', ?, ?)`,
  ).run(`id${n}`, `key${n}`, fields.title ?? 'Idea', fields.category ?? 'Product', fields.score ?? null, fields.loggedAt, fields.archivedAt ?? null);
  if (fields.curatedAt) {
    db.prepare("INSERT INTO best_of_entries (idea_id, period, curated_at) VALUES (?, 'today', ?)").run(`id${n}`, fields.curatedAt);
  }
  n++;
  db.close();
}
const get = (query = '', withCookie = true) =>
  GET(new Request(`http://localhost/api/today${query}`, { headers: withCookie ? { cookie } : {} }));

// 2026-10-14 15:00 UTC is 11:00 in Toronto (EDT, UTC-4)
const NOON_TORONTO = Date.UTC(2026, 9, 14, 16, 0);
const TORONTO_MIDNIGHT = Date.UTC(2026, 9, 14, 4, 0);

beforeEach(async () => {
  useTestDatabase();
  cookie = await signedInCookie();
  n = 0;
});

describe('GET /api/today (L2-008)', () => {
  it('Given a signed-out visitor, When today is requested, Then 401', async () => {
    expect((await get('', false)).status).toBe(401);
  });

  it('Given ideas logged today, When today is requested, Then they are listed newest first with the count and date', async () => {
    const now = Date.now();
    seed({ loggedAt: now - 2000, title: 'Older' });
    seed({ loggedAt: now - 1000, title: 'Newer' });

    const body = await (await get()).json();

    expect(body.total).toBe(2);
    expect(body.ideas.map((i: { title: string }) => i.title)).toEqual(['Newer', 'Older']);
    expect(body.ideas[0]).toMatchObject({ summary: 'summary', category: 'Product', status: 'Logged', score: null, bestOfToday: false });
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.timeZone).toBe('America/Toronto');
  });

  it('Given no ideas logged today, When today is requested, Then the list is empty and the total is 0', async () => {
    seed({ loggedAt: Date.now() - 3 * 24 * 3600 * 1000 });

    const body = await (await get()).json();

    expect(body).toMatchObject({ total: 0, ideas: [], best: null });
  });

  it('Given best-of-today ideas, When today is requested, Then they are marked and the best has the highest score, ties broken by the latest curated', async () => {
    const now = Date.now();
    seed({ loggedAt: now - 5000, title: 'Low', score: 5, curatedAt: now - 4000 });
    seed({ loggedAt: now - 4000, title: 'High early', score: 9, curatedAt: now - 3000 });
    seed({ loggedAt: now - 3000, title: 'High late', score: 9, curatedAt: now - 2000 });
    seed({ loggedAt: now - 2000, title: 'Not curated', score: 10 });

    const body = await (await get()).json();

    expect(body.best).toEqual({ id: 'id2', title: 'High late' });
    expect(body.ideas.filter((i: { bestOfToday: boolean }) => i.bestOfToday).map((i: { title: string }) => i.title).sort()).toEqual(['High early', 'High late', 'Low']);
  });

  it('Given an idea that was best of today yesterday, When today is requested, Then it is not marked', async () => {
    const now = Date.now();
    seed({ loggedAt: now - 2000, title: 'Lapsed', curatedAt: now - 30 * 3600 * 1000 });

    const body = await (await get()).json();

    expect(body.best).toBeNull();
    expect(body.ideas[0].bestOfToday).toBe(false);
  });

  it('Given a category, When today is requested, Then only that category is listed while the total stays', async () => {
    const now = Date.now();
    seed({ loggedAt: now - 2000, category: 'Photography' });
    seed({ loggedAt: now - 1000, category: 'Product' });

    const body = await (await get('?category=Photography')).json();

    expect(body.total).toBe(2);
    expect(body.ideas).toHaveLength(1);
    expect(body.ideas[0].category).toBe('Photography');
  });

  it('Given archived ideas logged today, When today is requested, Then they are not listed', async () => {
    seed({ loggedAt: Date.now() - 1000, archivedAt: Date.now() });

    expect((await (await get()).json()).total).toBe(0);
  });
});

describe('getTodaySummary day boundary (L2-008 criterion 8)', () => {
  it('Given the owner time zone, When ideas straddle local midnight, Then only ideas from local midnight on count as today', () => {
    seed({ loggedAt: TORONTO_MIDNIGHT - 1, title: 'Yesterday 11:59 pm' });
    seed({ loggedAt: TORONTO_MIDNIGHT, title: 'Today 12:00 am' });

    const summary = getTodaySummary(undefined, NOON_TORONTO);

    expect(summary.ideas.map((i) => i.title)).toEqual(['Today 12:00 am']);
    expect(summary.date).toBe('2026-10-14');
  });

  it('Given a day after the clocks change, When ideas straddle local midnight, Then the boundary follows the new offset', () => {
    const winterNoon = Date.UTC(2026, 10, 2, 17, 0);
    const winterMidnight = Date.UTC(2026, 10, 2, 5, 0); // EST, UTC-5
    seed({ loggedAt: winterMidnight - 1, title: 'Before' });
    seed({ loggedAt: winterMidnight, title: 'After' });

    expect(getTodaySummary(undefined, winterNoon).ideas.map((i) => i.title)).toEqual(['After']);
  });
});
