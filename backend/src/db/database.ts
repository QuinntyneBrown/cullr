import { DatabaseSync } from 'node:sqlite';

export function openDatabase(): DatabaseSync {
  return new DatabaseSync(process.env.CULLR_DB_PATH ?? 'cullr.db');
}

export function databaseAnswers(): boolean {
  try {
    const db = openDatabase();
    try {
      db.prepare('SELECT 1').get();
      return true;
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}
