import { openDatabase } from '../../db/database';
import { CATEGORIES, IDEA_COLUMNS, toDto, type Category, type IdeaDto, type IdeaRow } from '../idea';
import { localDate, ownerTimeZone, startOfLocalDay } from '../time-zone';

export interface TodayIdea extends IdeaDto {
  bestOfToday: boolean;
}

export interface TodaySummary {
  date: string;
  timeZone: string;
  total: number;
  best: { id: string; title: string } | null;
  ideas: TodayIdea[];
}

export function getTodaySummary(category: Category | undefined, now = Date.now()): TodaySummary {
  const timeZone = ownerTimeZone();
  const { year, month, day } = localDate(timeZone, now);
  const start = startOfLocalDay(timeZone, year, month, day);
  const end = startOfLocalDay(timeZone, year, month, day + 1);

  const db = openDatabase();
  try {
    const rows = db
      .prepare(
        `SELECT ${IDEA_COLUMNS} FROM ideas
         WHERE archived_at IS NULL AND logged_at >= ? AND logged_at < ?
         ORDER BY logged_at DESC`,
      )
      .all(start, end) as unknown as IdeaRow[];
    const best = rows
      .filter((r) => r.curated_at !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.curated_at! - a.curated_at!)[0];
    return {
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      timeZone,
      total: rows.length,
      best: best ? { id: best.id, title: best.title } : null,
      ideas: rows
        .filter((r) => !category || r.category === category)
        .map((r) => ({ ...toDto(r), bestOfToday: r.curated_at !== null })),
    };
  } finally {
    db.close();
  }
}

export const isCategory = (value: string | null): value is Category => CATEGORIES.includes(value as Category);
