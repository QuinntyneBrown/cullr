import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../../../db/database';
import { signedInCookie } from '../../../../access/test-session';
import { useTestDatabase } from '../../../../access/test-database';
import { POST } from '../route';
import { GET } from './route';

let cookie: string;

const get = (id: string, withCookie = true) =>
  GET(new Request(`http://localhost/api/ideas/${id}`, { headers: withCookie ? { cookie } : {} }), {
    params: Promise.resolve({ id }),
  });

beforeEach(async () => {
  useTestDatabase();
  cookie = await signedInCookie();
});

function seed(archivedAt: number | null = null) {
  const db = openDatabase();
  db.prepare(
    `INSERT INTO ideas (id, capture_key, title, summary, category, score, status, logged_at, archived_at, strengths, risks, next_step, version)
     VALUES ('a1', 'k1', 'Porch Light', 'A favour board.', 'Product', 9, 'Critiquing', 1000, ?, 'Real need', 'Trust', 'Sketch it', 3)`,
  ).run(archivedAt);
  const history = db.prepare('INSERT INTO status_history (idea_id, description, at) VALUES (?, ?, ?)');
  history.run('a1', 'Logged', 1000);
  history.run('a1', 'Critiquing', 3000);
  history.run('a1', 'Curating', 2000);
  db.close();
}

describe('GET /api/ideas/[id] (L2-012)', () => {
  it('Given an existing idea, When viewed, Then it has its fields, critique notes and history newest first', async () => {
    seed();

    const res = await get('a1');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: 'a1',
      title: 'Porch Light',
      summary: 'A favour board.',
      category: 'Product',
      score: 9,
      status: 'Critiquing',
      loggedAt: 1000,
      strengths: 'Real need',
      risks: 'Trust',
      nextStep: 'Sketch it',
      version: 3,
      archived: false,
      history: [
        { description: 'Critiquing', at: 3000 },
        { description: 'Curating', at: 2000 },
        { description: 'Logged', at: 1000 },
      ],
    });
  });

  it('Given an archived idea, When viewed, Then it is flagged archived', async () => {
    seed(5000);

    expect((await (await get('a1')).json()).archived).toBe(true);
  });

  it('Given an unknown id, When viewed, Then 404', async () => {
    expect((await get('nope')).status).toBe(404);
  });

  it('Given a signed-out visitor, When viewing, Then 401', async () => {
    expect((await get('a1', false)).status).toBe(401);
  });

  it('Given a newly captured idea, When viewed, Then its history starts with Logged (L2-014)', async () => {
    const res = await POST(
      new Request('http://localhost/api/ideas', {
        method: 'POST',
        headers: { cookie },
        body: JSON.stringify({ captureKey: 'k', title: 'New', summary: '', category: 'Product', score: null }),
      }),
    );
    const { id } = await res.json();

    const idea = await (await get(id)).json();

    expect(idea.status).toBe('Logged');
    expect(idea.history.map((h: { description: string }) => h.description)).toEqual(['Logged']);
  });
});
