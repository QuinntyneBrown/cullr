import { openDatabase } from '../../db/database';
import { type IdeaStatus } from '../../ideas/idea';
import { PERIOD_CAPACITY, periodStart, type BestOfPeriod } from '../best-of-period';

export interface CuratedIdea {
  id: string;
  title: string;
}

export type CurateResult =
  | { outcome: 'ok'; period: BestOfPeriod; curated: CuratedIdea[]; alreadyBest: CuratedIdea[]; displaced: CuratedIdea[] }
  | { outcome: 'not-found' | 'archived' };

interface IdeaRow {
  id: string;
  title: string;
  status: IdeaStatus;
  archived_at: number | null;
}

export function curateIdeas(ideaIds: string[], period: BestOfPeriod, now = Date.now()): CurateResult {
  const db = openDatabase();
  try {
    db.exec('BEGIN IMMEDIATE');
    const ideas = ideaIds.map((id) => db.prepare('SELECT id, title, status, archived_at FROM ideas WHERE id = ?').get(id) as IdeaRow | undefined);
    if (ideas.some((i) => !i)) {
      db.exec('ROLLBACK');
      return { outcome: 'not-found' };
    }
    if (ideas.some((i) => i!.archived_at !== null)) {
      db.exec('ROLLBACK');
      return { outcome: 'archived' };
    }

    const current = db
      .prepare('SELECT id, idea_id FROM best_of_entries WHERE period = ? AND ended_at IS NULL AND curated_at >= ? ORDER BY curated_at, id')
      .all(period, periodStart(period, now)) as { id: number; idea_id: string }[];
    const titleOf = (ideaId: string) => (db.prepare('SELECT title FROM ideas WHERE id = ?').get(ideaId) as { title: string }).title;
    const curated: CuratedIdea[] = [];
    const alreadyBest: CuratedIdea[] = [];
    const displaced: CuratedIdea[] = [];

    ideas.forEach((idea, index) => {
      const { id, title } = idea!;
      if (current.some((e) => e.idea_id === id)) {
        alreadyBest.push({ id, title });
        return;
      }
      if (current.length >= PERIOD_CAPACITY) {
        const oldest = current.shift()!;
        db.prepare('UPDATE best_of_entries SET ended_at = ? WHERE id = ?').run(now, oldest.id);
        displaced.push({ id: oldest.idea_id, title: titleOf(oldest.idea_id) });
      }
      // index keeps selection order within one request
      const { lastInsertRowid } = db
        .prepare('INSERT INTO best_of_entries (idea_id, period, curated_at) VALUES (?, ?, ?)')
        .run(id, period, now + index);
      current.push({ id: Number(lastInsertRowid), idea_id: id });
      curated.push({ id, title });
      if (idea!.status === 'Logged' || idea!.status === 'Critiquing') {
        db.prepare('UPDATE ideas SET status = ?, version = version + 1 WHERE id = ?').run('Curating', id);
        db.prepare('INSERT INTO status_history (idea_id, description, at) VALUES (?, ?, ?)').run(id, 'Curating', now);
      }
    });
    db.exec('COMMIT');
    return { outcome: 'ok', period, curated, alreadyBest, displaced };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}
