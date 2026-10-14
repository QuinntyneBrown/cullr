import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BestOfPeriod, Category, CATEGORIES, CuratedList, CurationService } from '@cullr/api';
import { Badge, Button, Card, Chip, EmptyState, Skeleton } from '@cullr/components';
import { CurateIdeaDialogService } from '../../core/curate/curate-idea-dialog.service';
import { categoryTone, statusTone } from '../../core/ideas/tones';

const OVERLINES: Record<BestOfPeriod, string> = {
  today: 'Best of today',
  week: 'Best of this week',
  month: 'Best of this month',
  year: 'Best of the year so far',
};

@Component({
  selector: 'app-curated-page',
  imports: [Badge, Button, Card, Chip, EmptyState, RouterLink, Skeleton],
  template: `
    <div class="page-header">
      <div>
        <h1>Curated</h1>
        @if (data(); as d) {
          <p class="subtitle">{{ subtitle(d) }}</p>
        }
      </div>
    </div>
    <div class="cluster" style="margin-bottom: var(--space-6);">
      @for (c of categories; track c) {
        <cu-chip [pressed]="category() === c" (pressedChange)="category.set($event ? c : null)">{{ c }}</cu-chip>
      }
    </div>
    @if (failed()) {
      <cu-empty-state [error]="true" title="Curated ideas couldn't load">
        Something went wrong fetching your curated ideas. Check your connection and try again.
        <cu-button actions variant="primary" (click)="load()">Try again</cu-button>
        <cu-button actions routerLink="/today">Back to Today</cu-button>
      </cu-empty-state>
    } @else if (data(); as d) {
      @if (d.items.length === 0) {
        <cu-empty-state title="Nothing curated yet">
          Curate your best ideas from Today or Ideas and they will be collected here.
          <cu-button actions variant="primary" routerLink="/ideas">Go to Ideas</cu-button>
        </cu-empty-state>
      } @else if (visible(d).length === 0) {
        <cu-empty-state title="No curated ideas match these filters">
          Nothing curated is tagged {{ category() }}. Clear the filter to see everything curated.
          <cu-button actions (click)="category.set(null)">Clear filters</cu-button>
        </cu-empty-state>
      } @else {
        <div class="grid">
          @for (item of visible(d); track item.period + item.idea.id) {
            <div cuCard style="grid-column: span 6;">
              <div class="overline">{{ overline(item.period) }}</div>
              <h2 class="card__title" style="margin-top: var(--space-1); overflow-wrap: anywhere;">
                <a [routerLink]="['/ideas', item.idea.id]">{{ item.idea.title }}</a>
              </h2>
              <div class="cluster" style="gap: var(--space-2);">
                <cu-badge [tone]="tone(item.idea.category)">{{ item.idea.category }}</cu-badge>
                <cu-badge [tone]="status(item.idea.status)">{{ item.idea.status }}</cu-badge>
              </div>
              @if (item.idea.summary) {
                <p style="overflow-wrap: anywhere;">{{ item.idea.summary }}</p>
              }
            </div>
          }
        </div>
      }
    } @else {
      <div class="grid" aria-busy="true">
        @for (n of [1, 2]; track n) {
          <div cuCard style="grid-column: span 6;">
            <cu-skeleton variant="title" width="40%" />
            <cu-skeleton width="90%" />
            <cu-skeleton width="60%" />
          </div>
        }
      </div>
    }
  `,
})
export class CuratedPage {
  private readonly curation = inject(CurationService);
  private readonly curate = inject(CurateIdeaDialogService);
  protected readonly categories = CATEGORIES;
  protected readonly category = signal<Category | null>(null);
  protected readonly data = signal<CuratedList | null>(null);
  protected readonly failed = signal(false);
  private request = 0;

  constructor() {
    effect(() => {
      this.curate.version();
      untracked(() => void this.load());
    });
  }

  protected tone = (c: Category) => categoryTone[c];
  protected status = (s: keyof typeof statusTone) => statusTone[s];
  protected overline = (p: BestOfPeriod) => OVERLINES[p];

  protected visible(d: CuratedList) {
    const category = this.category();
    return category ? d.items.filter((i) => i.idea.category === category) : d.items;
  }

  protected async load(): Promise<void> {
    const request = ++this.request;
    this.failed.set(false);
    this.data.set(null);
    try {
      const data = await this.curation.getCurated();
      if (request === this.request) this.data.set(data);
    } catch {
      if (request === this.request) this.failed.set(true);
    }
  }

  protected subtitle(d: CuratedList): string {
    const n = d.distinctIdeaCount;
    const date = new Date(`${d.asOf}T12:00:00Z`);
    const part = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-CA', { ...options, timeZone: 'UTC' }).format(date);
    return `${n} ${n === 1 ? 'idea' : 'ideas'} curated as of ${part({ weekday: 'short' })} ${part({ day: 'numeric' })} ${part({ month: 'short' })}`;
  }
}
