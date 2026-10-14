import { openDatabase } from '../../db/database';
import { type IdeaStatus } from '../idea';
import { getIdea, type IdeaDetail } from '../view-idea/get-idea';

export const MANUAL_STATUSES = ['Building', 'Built'] as const;

export type SetStatusResult =
  | { outcome: 'ok'; idea: IdeaDetail }
  | { outcome: 'invalid' | 'not-found' | 'archived' };

export function setIdeaStatus(id: string, status: unknown): SetStatusResult {
  if (!MANUAL_STATUSES.includes(status as (typeof MANUAL_STATUSES)[number])) return { outcome: 'invalid' };

  const db = openDatabase();
  try {
    db.exec('BEGIN IMMEDIATE');
    const row = db.prepare('SELECT status, archived_at FROM ideas WHERE id = ?').get(id) as
      | { status: IdeaStatus; archived_at: number | null }
      | undefined;
    if (!row || row.archived_at !== null) {
      db.exec('ROLLBACK');
      return { outcome: row ? 'archived' : 'not-found' };
    }
    if (row.status !== status) {
      db.prepare('UPDATE ideas SET status = ?, version = version + 1 WHERE id = ?').run(status as string, id);
      db.prepare('INSERT INTO status_history (idea_id, description, at) VALUES (?, ?, ?)').run(id, status as string, Date.now());
    }
    db.exec('COMMIT');
  } finally {
    db.close();
  }
  return { outcome: 'ok', idea: getIdea(id)! };
}
