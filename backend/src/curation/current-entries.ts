import type { DatabaseSync } from 'node:sqlite';
import { periodStart, PERIODS, type BestOfPeriod } from './best-of-period';

export interface CurrentEntry {
  ideaId: string;
  period: BestOfPeriod;
  curatedAt: number;
}

// A period lapses by itself: an entry curated before the period's current start is no longer best of it.
export function currentEntries(db: DatabaseSync, now: number): CurrentEntry[] {
  const rows = db
    .prepare('SELECT idea_id, period, curated_at FROM best_of_entries WHERE ended_at IS NULL')
    .all() as { idea_id: string; period: BestOfPeriod; curated_at: number }[];
  const starts = Object.fromEntries(PERIODS.map((p) => [p, periodStart(p, now)]));
  return rows
    .filter((r) => r.curated_at >= starts[r.period])
    .map((r) => ({ ideaId: r.idea_id, period: r.period, curatedAt: r.curated_at }));
}
