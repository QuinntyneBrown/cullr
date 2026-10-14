export const CATEGORIES = ['Toronto & GTA', 'Photography', 'Faith & ministry', 'Product', 'Engineering'] as const;
export type Category = (typeof CATEGORIES)[number];

// Lifecycle order is also the sort order for Status.
export const STATUSES = ['Logged', 'Critiquing', 'Curating', 'Building', 'Built'] as const;
export type IdeaStatus = (typeof STATUSES)[number];

export interface IdeaRow {
  id: string;
  title: string;
  summary: string;
  category: Category;
  score: number | null;
  status: IdeaStatus;
  logged_at: number;
}

export interface IdeaDto {
  id: string;
  title: string;
  summary: string;
  category: Category;
  score: number | null;
  status: IdeaStatus;
  loggedAt: number;
}

export const toDto = (row: IdeaRow): IdeaDto => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  category: row.category,
  score: row.score,
  status: row.status,
  loggedAt: row.logged_at,
});

export const IDEA_COLUMNS = 'id, title, summary, category, score, status, logged_at';
