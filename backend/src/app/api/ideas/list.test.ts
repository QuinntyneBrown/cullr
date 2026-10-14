import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../db/database';
import { signedInCookie } from '../../../access/test-session';
import { useTestDatabase } from '../../../access/test-database';
import { GET } from './route';

let cookie: string;
let n = 0;

function seed(fields: { title?: string; summary?: string; category?: string; score?: number | null; status?: string; loggedAt?: number; archivedAt?: number | null; notes?: string }) {
  const db = openDatabase();
  db.prepare(
    `INSERT INTO ideas (id, capture_key, title, summary, category, score, status, logged_at, archived_at, critique_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(`id${n}`, `key${n++}`, fields.title ?? `Idea ${n}`, fields.summary ?? '', fields.category ?? 'Product', fields.score ?? null, fields.status ?? 'Logged', fields.loggedAt ?? Date.now() - n * 1000, fields.archivedAt ?? null, fields.notes ?? '');
  db.close();
}
const list = async (query = '') => {
  const res = await GET(new Request(`http://localhost/api/ideas${query}`, { headers: { cookie } }));
  return res.json();
};
const titles = (body: { items: { title: string }[] }) => body.items.map((i) => i.title);

beforeEach(async () => {
  useTestDatabase();
  cookie = await signedInCookie();
  n = 0;
});

describe('GET /api/ideas (L2-009, L2-010)', () => {
  it('Given a signed-out visitor, When ideas are requested, Then 401', async () => {
    expect((await GET(new Request('http://localhost/api/ideas'))).status).toBe(401);
  });

  it('Given active and archived ideas, When listed, Then only active ideas are returned, newest first, with the subtitle counts', async () => {
    seed({ title: 'Old', loggedAt: Date.now() - 5000 });
    seed({ title: 'New', loggedAt: Date.now() - 1000 });
    seed({ title: 'Gone', archivedAt: Date.now() });
    seed({ title: 'Last year', loggedAt: Date.UTC(2020, 0, 1) });

    const body = await list();

    expect(titles(body)).toEqual(['New', 'Old', 'Last year']);
    expect(body.items[0]).toMatchObject({ category: 'Product', status: 'Logged', score: null });
    expect(body.summary).toEqual({ quarter: 2, active: 3, archived: 1 });
    expect(body.total).toBe(3);
  });

  it('Given more than 50 ideas, When listed, Then a page holds at most 50 and the next page holds the rest', async () => {
    for (let i = 0; i < 52; i++) seed({ loggedAt: Date.now() - i * 1000 });

    const first = await list();
    const second = await list('?page=2');

    expect(first.items).toHaveLength(50);
    expect(first.total).toBe(52);
    expect(second.items).toHaveLength(2);
    expect(second.page).toBe(2);
  });

  it('Given a status tab, When selected, Then only that status is listed and tab counts stay accurate for the other filters', async () => {
    seed({ title: 'A', status: 'Logged', category: 'Product' });
    seed({ title: 'B', status: 'Critiquing', category: 'Product' });
    seed({ title: 'C', status: 'Critiquing', category: 'Photography' });

    const body = await list('?status=Critiquing&category=Product');

    expect(titles(body)).toEqual(['B']);
    expect(body.counts).toEqual({ All: 2, Logged: 1, Critiquing: 1, Curating: 0, Building: 0 });
  });

  it('Given several categories, When toggled, Then ideas in any selected category are listed', async () => {
    seed({ title: 'A', category: 'Product' });
    seed({ title: 'B', category: 'Photography' });
    seed({ title: 'C', category: 'Engineering' });

    expect(titles(await list('?category=Product&category=Engineering')).sort()).toEqual(['A', 'C']);
  });

  it('Given the sort choices, When chosen, Then the list is ordered by newest, score with unscored last, or lifecycle status', async () => {
    seed({ title: 'Unscored', loggedAt: 3000, status: 'Building' });
    seed({ title: 'Five', score: 5, loggedAt: 2000, status: 'Logged' });
    seed({ title: 'Nine', score: 9, loggedAt: 1000, status: 'Curating' });

    expect(titles(await list('?sort=newest'))).toEqual(['Unscored', 'Five', 'Nine']);
    expect(titles(await list('?sort=score'))).toEqual(['Nine', 'Five', 'Unscored']);
    expect(titles(await list('?sort=status'))).toEqual(['Five', 'Nine', 'Unscored']);
  });

  it('Given a query, When searched, Then title, summary and critique notes match case-insensitively', async () => {
    seed({ title: 'Porch Light' });
    seed({ title: 'B', summary: 'a PORCH board' });
    seed({ title: 'C', notes: 'porch lighting is hard' });
    seed({ title: 'D' });

    expect(titles(await list('?q=porch')).sort()).toEqual(['B', 'C', 'Porch Light']);
  });

  it('Given a query with wildcard characters, When searched, Then they match literally', async () => {
    seed({ title: '100% done' });
    seed({ title: 'Other' });

    expect(titles(await list('?q=%25'))).toEqual(['100% done']);
  });

  it('Given tab, category, sort and query together, When listed, Then all combine with AND', async () => {
    seed({ title: 'Match', status: 'Logged', category: 'Product', summary: 'lamp', score: 3 });
    seed({ title: 'Wrong status', status: 'Building', category: 'Product', summary: 'lamp' });
    seed({ title: 'Wrong category', category: 'Photography', summary: 'lamp' });
    seed({ title: 'Wrong query', category: 'Product', summary: 'chair' });

    expect(titles(await list('?status=Logged&category=Product&q=lamp&sort=score'))).toEqual(['Match']);
  });

  it('Given filters that match nothing, When listed, Then the result is empty', async () => {
    seed({ title: 'A' });

    const body = await list('?q=zzz');

    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });
});
