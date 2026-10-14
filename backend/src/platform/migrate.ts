import { DatabaseSync } from 'node:sqlite';

const migrations = [{ id: '0001_initial', sql: '' }];

export function runMigrations(path: string): void {
  const db = new DatabaseSync(path);
  try {
    db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY)');
    const applied = new Set(
      (db.prepare('SELECT id FROM schema_migrations').all() as { id: string }[]).map((r) => r.id),
    );
    for (const m of migrations.filter((x) => !applied.has(x.id))) {
      db.exec('BEGIN');
      try {
        db.exec(m.sql);
        db.prepare('INSERT INTO schema_migrations (id) VALUES (?)').run(m.id);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }
  } finally {
    db.close();
  }
}

if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations(process.env.CULLR_DB_PATH ?? 'cullr.db');
  console.log('Migrations applied');
}
