import { HttpClient, HttpContext, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HANDLES_OWN_ERRORS } from '../handles-own-errors';

export const CATEGORIES = ['Toronto & GTA', 'Photography', 'Faith & ministry', 'Product', 'Engineering'] as const;
export type Category = (typeof CATEGORIES)[number];
export const STATUSES = ['Logged', 'Critiquing', 'Curating', 'Building', 'Built'] as const;
export type IdeaStatus = (typeof STATUSES)[number];
export type IdeaSort = 'newest' | 'score' | 'status';

export interface Idea {
  id: string;
  title: string;
  summary: string;
  category: Category;
  score: number | null;
  status: IdeaStatus;
  loggedAt: number;
}

export interface CaptureInput {
  title: string;
  summary: string;
  category: string;
  score: number | string | null;
}

export type CaptureResult =
  | { outcome: 'ok'; idea: Idea }
  | { outcome: 'rejected'; errors: Record<string, string> }
  | { outcome: 'failed' };

export interface IdeaDetail extends Idea {
  strengths: string;
  risks: string;
  nextStep: string;
  version: number;
  archived: boolean;
  history: { description: string; at: number }[];
}

export interface IdeaChanges {
  title: string;
  summary: string;
  category: string;
  score: number | string | null;
  strengths: string;
  risks: string;
  nextStep: string;
}

export type UpdateResult =
  | { outcome: 'ok'; idea: IdeaDetail }
  | { outcome: 'rejected'; errors: Record<string, string> }
  | { outcome: 'changed'; current: IdeaDetail }
  | { outcome: 'archived' | 'failed' };

export type SetStatusResult = { outcome: 'ok'; idea: IdeaDetail } | { outcome: 'failed' };

export interface TodayIdea extends Idea {
  bestOfToday: boolean;
}

export interface TodaySummary {
  date: string;
  timeZone: string;
  total: number;
  best: { id: string; title: string } | null;
  ideas: TodayIdea[];
}

export interface IdeaCriteria {
  status?: IdeaStatus;
  categories: Category[];
  sort: IdeaSort;
  query: string;
  page: number;
}

export interface IdeaPage {
  items: Idea[];
  allIds: string[];
  page: number;
  pageSize: number;
  total: number;
  counts: Record<'All' | 'Logged' | 'Critiquing' | 'Curating' | 'Building', number>;
  summary: { quarter: number; active: number; archived: number };
}

const context = () => new HttpContext().set(HANDLES_OWN_ERRORS, true);

@Injectable({ providedIn: 'root' })
export class IdeaService {
  private readonly http = inject(HttpClient);

  async capture(input: CaptureInput, captureKey: string): Promise<CaptureResult> {
    try {
      const idea = await firstValueFrom(
        this.http.post<Idea>('/api/ideas', { ...input, captureKey }, { context: context() }),
      );
      return { outcome: 'ok', idea };
    } catch (error) {
      const errors = error instanceof HttpErrorResponse && error.status === 400
        ? (error.error as { errors?: Record<string, string> } | null)?.errors
        : undefined;
      return errors ? { outcome: 'rejected', errors } : { outcome: 'failed' };
    }
  }

  get(id: string): Promise<IdeaDetail> {
    return firstValueFrom(this.http.get<IdeaDetail>(`/api/ideas/${id}`, { context: context() }));
  }

  async update(id: string, changes: IdeaChanges, version: number, overwrite: boolean): Promise<UpdateResult> {
    try {
      const idea = await firstValueFrom(
        this.http.put<IdeaDetail>(`/api/ideas/${id}`, { ...changes, version, overwrite }, { context: context() }),
      );
      return { outcome: 'ok', idea };
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const body = error.error as { errors?: Record<string, string>; current?: IdeaDetail } | null;
        if (error.status === 400 && body?.errors) return { outcome: 'rejected', errors: body.errors };
        if (error.status === 409 && body?.current) return { outcome: 'changed', current: body.current };
        if (error.status === 422) return { outcome: 'archived' };
      }
      return { outcome: 'failed' };
    }
  }

  async setStatus(id: string, status: IdeaStatus): Promise<SetStatusResult> {
    try {
      const idea = await firstValueFrom(
        this.http.put<IdeaDetail>(`/api/ideas/${id}/status`, { status }, { context: context() }),
      );
      return { outcome: 'ok', idea };
    } catch {
      return { outcome: 'failed' };
    }
  }

  today(category?: Category): Promise<TodaySummary> {
    const params = category ? new HttpParams().set('category', category) : undefined;
    return firstValueFrom(this.http.get<TodaySummary>('/api/today', { params, context: context() }));
  }

  list(criteria: IdeaCriteria): Promise<IdeaPage> {
    let params = new HttpParams().set('sort', criteria.sort).set('page', criteria.page);
    if (criteria.status) params = params.set('status', criteria.status);
    for (const category of criteria.categories) params = params.append('category', category);
    if (criteria.query) params = params.set('q', criteria.query);
    return firstValueFrom(this.http.get<IdeaPage>('/api/ideas', { params, context: context() }));
  }
}
