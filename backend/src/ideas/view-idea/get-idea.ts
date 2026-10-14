import { openDatabase } from '../../db/database';
import { IDEA_COLUMNS, toDto, type IdeaDto, type IdeaRow } from '../idea';

export interface IdeaDetail extends IdeaDto {
  strengths: string;
  risks: string;
  nextStep: string;
  version: number;
  archived: boolean;
  history: { description: string; at: number }[];
}

interface DetailRow extends IdeaRow {
  strengths: string;
  risks: string;
  next_step: string;
  version: number;
  archived_at: number | null;
}

export const DETAIL_COLUMNS = `${IDEA_COLUMNS}, strengths, risks, next_step, version, archived_at`;

export const toDetail = (row: DetailRow, history: IdeaDetail['history']): IdeaDetail => ({
  ...toDto(row),
  strengths: row.strengths,
  risks: row.risks,
  nextStep: row.next_step,
  version: row.version,
  archived: row.archived_at !== null,
  history,
});

export function getIdea(id: string): IdeaDetail | null {
  const db = openDatabase();
  try {
    const row = db.prepare(`SELECT ${DETAIL_COLUMNS} FROM ideas WHERE id = ?`).get(id) as unknown as DetailRow | undefined;
    if (!row) return null;
    const history = db
      .prepare('SELECT description, at FROM status_history WHERE idea_id = ? ORDER BY at DESC, id DESC')
      .all(id) as unknown as IdeaDetail['history'];
    return toDetail(row, history);
  } finally {
    db.close();
  }
}
