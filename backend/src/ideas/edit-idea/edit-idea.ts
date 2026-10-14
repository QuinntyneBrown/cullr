import { openDatabase } from '../../db/database';
import { CATEGORIES, type Category, type IdeaStatus } from '../idea';
import { StatusPolicy } from '../idea-status/status-policy';
import { DETAIL_COLUMNS, getIdea, type IdeaDetail } from '../view-idea/get-idea';

export type EditResult =
  | { outcome: 'updated'; idea: IdeaDetail }
  | { outcome: 'invalid'; errors: Record<string, string> }
  | { outcome: 'not-found' }
  | { outcome: 'archived' }
  | { outcome: 'changed'; current: IdeaDetail };

const NOTE_LIMIT = 1000;

export function editIdea(id: string, input: Record<string, unknown>): EditResult {
  const errors: Record<string, string> = {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const summary = typeof input.summary === 'string' ? input.summary : '';
  const score = input.score ?? null;
  const notes = { strengths: text(input.strengths), risks: text(input.risks), nextStep: text(input.nextStep) };

  if (!title) errors.title = 'Enter a title for this idea';
  else if (title.length > 120) errors.title = 'Use 120 characters or fewer';
  if (summary.length > 1000) errors.summary = 'Use 1,000 characters or fewer';
  if (!CATEGORIES.includes(input.category as Category)) errors.category = 'Choose a category';
  if (score !== null && !(Number.isInteger(score) && (score as number) >= 1 && (score as number) <= 10)) {
    errors.score = 'Enter a whole number from 1 to 10';
  }
  for (const [field, value] of Object.entries(notes)) {
    if (value.length > NOTE_LIMIT) errors[field] = 'Use 1,000 characters or fewer';
  }
  if (Object.keys(errors).length) return { outcome: 'invalid', errors };

  const db = openDatabase();
  try {
    db.exec('BEGIN IMMEDIATE');
    const row = db.prepare(`SELECT ${DETAIL_COLUMNS} FROM ideas WHERE id = ?`).get(id) as
      | { status: IdeaStatus; version: number; archived_at: number | null }
      | undefined;
    if (!row) {
      db.exec('ROLLBACK');
      return { outcome: 'not-found' };
    }
    if (row.archived_at !== null) {
      db.exec('ROLLBACK');
      return { outcome: 'archived' };
    }
    if (input.overwrite !== true && input.version !== row.version) {
      db.exec('ROLLBACK');
      return { outcome: 'changed', current: getIdea(id)! };
    }

    const hasNotes = Object.values(notes).some(Boolean);
    const status = hasNotes ? StatusPolicy.afterNotesSaved(row.status) : row.status;
    const now = Date.now();
    db.prepare(
      `UPDATE ideas SET title = ?, summary = ?, category = ?, score = ?, strengths = ?, risks = ?, next_step = ?,
         status = ?, version = version + 1 WHERE id = ?`,
    ).run(title, summary, input.category as string, score as number | null, notes.strengths, notes.risks, notes.nextStep, status, id);
    if (status !== row.status) {
      db.prepare('INSERT INTO status_history (idea_id, description, at) VALUES (?, ?, ?)').run(id, status, now);
    }
    db.exec('COMMIT');
  } finally {
    db.close();
  }
  return { outcome: 'updated', idea: getIdea(id)! };
}
