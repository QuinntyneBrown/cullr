import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GET } from './route';

const dirs: string[] = [];
const tempDb = () => {
  const dir = mkdtempSync(join(tmpdir(), 'cullr-'));
  dirs.push(dir);
  return join(dir, 'cullr.db');
};

afterEach(() => {
  delete process.env.CULLR_DB_PATH;
  dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true }));
});

describe('GET /api/health', () => {
  it('Given the database answers, When health is requested without sign-in, Then service and database are up', async () => {
    process.env.CULLR_DB_PATH = tempDb();

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ service: 'up', database: 'up' });
  });

  it('Given the database is unavailable, When health is requested, Then database is down with no internal detail', async () => {
    process.env.CULLR_DB_PATH = join(tempDb(), 'missing-dir', 'cullr.db');

    const res = await GET();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ service: 'up', database: 'down' });
  });
});
