import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from './migrate';

const dirs: string[] = [];
const tempDb = () => {
  const dir = mkdtempSync(join(tmpdir(), 'cullr-'));
  dirs.push(dir);
  return join(dir, 'cullr.db');
};
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

const tables = (path: string) => {
  const db = new DatabaseSync(path);
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
  db.close();
  return rows.map((r) => r.name);
};

describe('runMigrations', () => {
  it('Given a new database, When migrations run explicitly, Then only the migrations table exists and the migration is recorded once', () => {
    const path = tempDb();

    runMigrations(path);
    runMigrations(path);

    expect(tables(path)).toEqual(['schema_migrations']);
    const db = new DatabaseSync(path);
    const applied = db.prepare('SELECT id FROM schema_migrations').all();
    db.close();
    expect(applied).toEqual([{ id: '0001_initial' }]);
  });

  it('Given pending migrations, When the database is merely opened or health-checked, Then nothing is applied', async () => {
    const path = tempDb();
    process.env.CULLR_DB_PATH = path;
    const { databaseAnswers } = await import('../db/database');

    expect(databaseAnswers()).toBe(true);
    delete process.env.CULLR_DB_PATH;

    expect(tables(path)).toEqual([]);
  });
});
