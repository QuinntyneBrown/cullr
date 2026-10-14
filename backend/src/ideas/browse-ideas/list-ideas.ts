import { openDatabase } from '../../db/database';
import { CATEGORIES, IDEA_COLUMNS, STATUSES, toDto, type Category, type IdeaDto, type IdeaRow, type IdeaStatus } from '../idea';
import { localDate, ownerTimeZone, startOfLocalDay } from '../time-zone';

export const PAGE_SIZE = 50;
export const TAB_STATUSES = ['Logged', 'Critiquing', 'Curating', 'Building'] as const;
export const SORTS = ['newest', 'score', 'status'] as const;
export type Sort = (typeof SORTS)[number];

export interface IdeaCriteria {
  status?: IdeaStatus;
  categories: Category[];
  sort: Sort;
  query: string;
  page: number;
}

export interface IdeaPage {
  items: IdeaDto[];
  page: number;
  pageSize: number;
  total: number;
  counts: Record<'All' | (typeof TAB_STATUSES)[number], number>;
  summary: { quarter: number; active: number; archived: number };
}

export function parseCriteria(params: URLSearchParams): IdeaCriteria {
  const status = params.get('status') as IdeaStatus;
  const sort = params.get('sort') as Sort;
  const page = Number(params.get('page'));
  return {
    status: STATUSES.includes(status) ? status : undefined,
    categories: params.getAll('category').filter((c): c is Category => CATEGORIES.includes(c as Category)),
    sort: SORTS.includes(sort) ? sort : 'newest',
    query: params.get('q')?.trim() ?? '',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

const ORDER: Record<Sort, string> = {
  newest: 'logged_at DESC',
  score: 'score IS NULL, score DESC, logged_at DESC',
  status: `CASE status ${STATUSES.map((s, i) => `WHEN '${s}' THEN ${i}`).join(' ')} END, logged_at DESC`,
};

export function listIdeas(criteria: IdeaCriteria, now = Date.now()): IdeaPage {
  const shared: string[] = ['archived_at IS NULL'];
  const args: (string | number)[] = [];
  if (criteria.categories.length) {
    shared.push(`category IN (${criteria.categories.map(() => '?').join(', ')})`);
    args.push(...criteria.categories);
  }
  if (criteria.query) {
    shared.push(
      "(instr(lower(title), lower(?)) > 0 OR instr(lower(summary), lower(?)) > 0 OR instr(lower(strengths || ' ' || risks || ' ' || next_step), lower(?)) > 0)",
    );
    args.push(criteria.query, criteria.query, criteria.query);
  }
  const where = (extra: string[]) => `WHERE ${[...shared, ...extra].join(' AND ')}`;

  const timeZone = ownerTimeZone();
  const today = localDate(timeZone, now);
  const quarterStart = startOfLocalDay(timeZone, today.year, today.month - (today.month % 3), 1);

  const db = openDatabase();
  try {
    const byStatus = db
      .prepare(`SELECT status, count(*) AS n FROM ideas ${where([])} GROUP BY status`)
      .all(...args) as unknown as { status: IdeaStatus; n: number }[];
    const count = (status: IdeaStatus) => byStatus.find((r) => r.status === status)?.n ?? 0;
    const counts = {
      All: byStatus.reduce((sum, r) => sum + r.n, 0),
      Logged: count('Logged'),
      Critiquing: count('Critiquing'),
      Curating: count('Curating'),
      Building: count('Building'),
    };

    const filtered = criteria.status ? where(['status = ?']) : where([]);
    const filterArgs = criteria.status ? [...args, criteria.status] : args;
    const total = (db.prepare(`SELECT count(*) AS n FROM ideas ${filtered}`).get(...filterArgs) as { n: number }).n;
    const rows = db
      .prepare(`SELECT ${IDEA_COLUMNS} FROM ideas ${filtered} ORDER BY ${ORDER[criteria.sort]} LIMIT ? OFFSET ?`)
      .all(...filterArgs, PAGE_SIZE, (criteria.page - 1) * PAGE_SIZE) as unknown as IdeaRow[];

    const overall = db
      .prepare(
        `SELECT count(CASE WHEN logged_at >= ? THEN 1 END) AS quarter,
                count(CASE WHEN archived_at IS NULL THEN 1 END) AS active,
                count(CASE WHEN archived_at IS NOT NULL THEN 1 END) AS archived
         FROM ideas`,
      )
      .get(quarterStart) as { quarter: number; active: number; archived: number };

    return { items: rows.map(toDto), page: criteria.page, pageSize: PAGE_SIZE, total, counts, summary: overall };
  } finally {
    db.close();
  }
}
