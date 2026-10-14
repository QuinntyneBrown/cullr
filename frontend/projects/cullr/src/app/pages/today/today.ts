import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Category, CATEGORIES, IdeaService, TodaySummary } from '@cullr/api';
import { Badge, Button, Card, Chip, EmptyState, Skeleton } from '@cullr/components';
import { CaptureIdeaDialogService } from '../../core/capture/capture-idea-dialog.service';
import { CurateIdeaDialogService } from '../../core/curate/curate-idea-dialog.service';
import { categoryTone, statusTone } from '../../core/ideas/tones';

@Component({
  selector: 'app-today-page',
  imports: [Badge, Button, Card, Chip, EmptyState, Skeleton],
  template: `
    <div class="page-header">
      <div>
        <h1>Today</h1>
        @if (data(); as d) {
          <p class="subtitle">{{ subtitle(d) }}</p>
        }
      </div>
      <div class="cluster"><cu-button variant="primary" (click)="capture.open()">Capture idea</cu-button></div>
    </div>
    <div class="cluster" style="margin-bottom: var(--space-6);">
      @for (c of categories; track c) {
        <cu-chip [pressed]="category() === c" (pressedChange)="category.set($event ? c : null)">{{ c }}</cu-chip>
      }
    </div>
    @if (failed()) {
      <cu-empty-state [error]="true" title="Today's ideas couldn't load">
        Something went wrong fetching today's log. Check your connection and try again.
        <cu-button actions variant="primary" (click)="load()">Try again</cu-button>
      </cu-empty-state>
    } @else if (data(); as d) {
      @if (d.total === 0) {
        <cu-empty-state title="No ideas logged yet today">
          Capture the first idea of the day to start building today's best-of list.
          <cu-button actions variant="primary" (click)="capture.open()">Capture idea</cu-button>
        </cu-empty-state>
      } @else if (d.ideas.length === 0) {
        <cu-empty-state title="No ideas match these filters">
          Nothing logged today is tagged {{ category() }}. Clear the filter to see all of today's ideas.
          <cu-button actions (click)="category.set(null)">Clear filters</cu-button>
        </cu-empty-state>
      } @else {
        <section class="section" style="margin-top: 0;">
          @for (idea of d.ideas; track idea.id) {
            <div cuCard class="card--interactive" style="margin-bottom: var(--space-4);">
              <div class="card__header">
                <div>
                  <span style="font: var(--text-h4);">{{ idea.title }}</span>
                  <div class="cluster" style="margin-top: var(--space-1); gap: var(--space-2);">
                    <cu-badge [tone]="tone(idea.category)">{{ idea.category }}</cu-badge>
                    <cu-badge [tone]="status(idea.status)">{{ idea.status }}</cu-badge>
                    @if (idea.bestOfToday) {
                      <cu-badge tone="solid">Best of today</cu-badge>
                    }
                  </div>
                </div>
                @if (idea.score !== null) {
                  <span class="stat__value" style="font-size: var(--font-size-xl);" [attr.aria-label]="'Score ' + idea.score + ' out of 10'">{{ idea.score }}<span class="text-caption">/10</span></span>
                } @else {
                  <span class="text-caption">Not scored</span>
                }
              </div>
              @if (idea.summary) {
                <p>{{ idea.summary }}</p>
              }
              <div class="card__footer">
                <span class="text-caption" style="margin-right: auto;">Logged Today, {{ time(idea.loggedAt, d.timeZone) }}</span>
                <cu-button (click)="curate.open([idea.id])">Curate</cu-button>
                <cu-button>Archive</cu-button>
              </div>
            </div>
          }
        </section>
      }
    } @else {
      <section class="section" style="margin-top: 0;" aria-busy="true">
        @for (n of [1, 2, 3]; track n) {
          <div cuCard style="margin-bottom: var(--space-4);">
            <cu-skeleton variant="title" width="40%" />
            <cu-skeleton width="90%" />
            <cu-skeleton width="60%" />
          </div>
        }
      </section>
    }
  `,
})
export class TodayPage {
  private readonly ideas = inject(IdeaService);
  protected readonly capture = inject(CaptureIdeaDialogService);
  protected readonly curate = inject(CurateIdeaDialogService);
  protected readonly categories = CATEGORIES;
  protected readonly category = signal<Category | null>(null);
  protected readonly data = signal<TodaySummary | null>(null);
  protected readonly failed = signal(false);
  private request = 0;

  constructor() {
    effect(() => {
      this.category();
      this.capture.version();
      this.curate.version();
      untracked(() => void this.load());
    });
  }

  protected tone = (c: Category) => categoryTone[c];
  protected status = (s: keyof typeof statusTone) => statusTone[s];

  protected async load(): Promise<void> {
    const request = ++this.request;
    this.failed.set(false);
    this.data.set(null);
    try {
      const data = await this.ideas.today(this.category() ?? undefined);
      if (request === this.request) this.data.set(data);
    } catch {
      if (request === this.request) this.failed.set(true);
    }
  }

  protected subtitle(d: TodaySummary): string {
    const count = `${d.total.toLocaleString('en-CA')} ${d.total === 1 ? 'idea' : 'ideas'} logged today`;
    const parts = [count];
    if (this.category() && d.ideas.length === 0 && d.total > 0) parts.push('0 match filters');
    else if (d.best) parts.push(`${d.best.title} is today's best`);
    const date = new Date(`${d.date}T12:00:00Z`);
    const part = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-CA', { ...options, timeZone: 'UTC' }).format(date);
    parts.push(`${part({ weekday: 'short' })} ${part({ day: 'numeric' })} ${part({ month: 'short' })}`);
    return parts.join(' · ');
  }

  protected time(ms: number, timeZone: string): string {
    return new Date(ms)
      .toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone })
      .replace(/\./g, '')
      .replace(/\u202f/g, ' ');
  }
}
