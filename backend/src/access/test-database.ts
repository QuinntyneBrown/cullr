import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMigrations } from '../platform/migrate';

export function useTestDatabase(): void {
  process.env.CULLR_DB_PATH = join(mkdtempSync(join(tmpdir(), 'cullr-')), 'cullr.db');
  runMigrations(process.env.CULLR_DB_PATH);
}
