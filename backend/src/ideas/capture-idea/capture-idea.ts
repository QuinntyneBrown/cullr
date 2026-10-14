import { randomUUID } from 'node:crypto';
import { openDatabase } from '../../db/database';
import { CATEGORIES, IDEA_COLUMNS, toDto, type Category, type IdeaDto, type IdeaRow } from '../idea';

export type CaptureResult =
  | { outcome: 'created' | 'existing'; idea: IdeaDto }
  | { outcome: 'invalid'; errors: Record<string, string> };

export function captureIdea(input: Record<string, unknown>): CaptureResult {
  const errors: Record<string, string> = {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const summary = typeof input.summary === 'string' ? input.summary : '';
  const score = input.score ?? null;
  const captureKey = typeof input.captureKey === 'string' ? input.captureKey : '';

  if (!title) errors.title = 'Enter a title for this idea';
  else if (title.length > 120) errors.title = 'Use 120 characters or fewer';
  if (summary.length > 1000) errors.summary = 'Use 1,000 characters or fewer';
  if (!CATEGORIES.includes(input.category as Category)) errors.category = 'Choose a category';
  if (score !== null && !(Number.isInteger(score) && (score as number) >= 1 && (score as number) <= 10)) {
    errors.score = 'Enter a whole number from 1 to 10';
  }
  if (!captureKey) errors.captureKey = 'Missing capture request key';
  if (Object.keys(errors).length) return { outcome: 'invalid', errors };

  const db = openDatabase();
  try {
    const id = randomUUID();
    const now = Date.now();
    const { changes } = db
      .prepare(
        `INSERT OR IGNORE INTO ideas (id, capture_key, title, summary, category, score, status, logged_at)
         VALUES (?, ?, ?, ?, ?, ?, 'Logged', ?)`,
      )
      .run(id, captureKey, title, summary, input.category as string, score as number | null, now);
    if (changes) {
      db.prepare("INSERT INTO status_history (idea_id, description, at) VALUES (?, 'Logged', ?)").run(id, now);
    }
    const row = db
      .prepare(`SELECT ${IDEA_COLUMNS} FROM ideas WHERE capture_key = ?`)
      .get(captureKey) as unknown as IdeaRow;
    return { outcome: changes ? 'created' : 'existing', idea: toDto(row) };
  } finally {
    db.close();
  }
}
