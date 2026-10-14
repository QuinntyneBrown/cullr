import { openDatabase } from '../../db/database';
import { toDto, IDEA_COLUMNS, type IdeaDto, type IdeaRow } from '../../ideas/idea';
import { localDate, ownerTimeZone } from '../../ideas/time-zone';
import { PERIODS, type BestOfPeriod } from '../best-of-period';
import { currentEntries } from '../current-entries';

export interface CuratedItem {
  period: BestOfPeriod;
  idea: IdeaDto;
}

export interface CuratedList {
  asOf: string;
  items: CuratedItem[];
  distinctIdeaCount: number;
}

export function getCurated(now = Date.now()): CuratedList {
  const { year, month, day } = localDate(ownerTimeZone(), now);
  const asOf = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const db = openDatabase();
  try {
    const entries = currentEntries(db, now);
    const byId = new Map<string, IdeaRow>();
    for (const { ideaId } of entries) {
      if (byId.has(ideaId)) continue;
      const row = db.prepare(`SELECT ${IDEA_COLUMNS} FROM ideas WHERE id = ? AND archived_at IS NULL`).get(ideaId) as unknown as IdeaRow | undefined;
      if (row) byId.set(ideaId, row);
    }
    const items = entries
      .filter((e) => byId.has(e.ideaId))
      .map((e) => ({ period: e.period, idea: toDto(byId.get(e.ideaId)!), curatedAt: e.curatedAt }))
      .sort(
        (a, b) =>
          PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period) ||
          (b.idea.score ?? -1) - (a.idea.score ?? -1) ||
          b.curatedAt - a.curatedAt,
      )
      .map(({ period, idea }) => ({ period, idea }));
    return { asOf, items, distinctIdeaCount: byId.size };
  } finally {
    db.close();
  }
}
