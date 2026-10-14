import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HANDLES_OWN_ERRORS } from '../handles-own-errors';
import type { Idea } from '../ideas/idea.service';

export const PERIODS = ['today', 'week', 'month', 'year'] as const;
export type BestOfPeriod = (typeof PERIODS)[number];

export interface CuratedIdeaRef {
  id: string;
  title: string;
}

export interface CurateOutcome {
  period: BestOfPeriod;
  curated: CuratedIdeaRef[];
  alreadyBest: CuratedIdeaRef[];
  displaced: CuratedIdeaRef[];
}

export type CurateResult = ({ outcome: 'ok' } & CurateOutcome) | { outcome: 'archived' | 'failed' };

export interface CuratedItem {
  period: BestOfPeriod;
  idea: Idea;
}

export interface CuratedList {
  asOf: string;
  items: CuratedItem[];
  distinctIdeaCount: number;
}

const context = () => new HttpContext().set(HANDLES_OWN_ERRORS, true);

@Injectable({ providedIn: 'root' })
export class CurationService {
  private readonly http = inject(HttpClient);

  async curate(ideaIds: string[], period: BestOfPeriod): Promise<CurateResult> {
    try {
      const outcome = await firstValueFrom(this.http.post<CurateOutcome>('/api/curation', { ideaIds, period }, { context: context() }));
      return { outcome: 'ok', ...outcome };
    } catch (error) {
      return error instanceof HttpErrorResponse && error.status === 422 ? { outcome: 'archived' } : { outcome: 'failed' };
    }
  }

  getCurated(): Promise<CuratedList> {
    return firstValueFrom(this.http.get<CuratedList>('/api/curation/curated', { context: context() }));
  }
}
