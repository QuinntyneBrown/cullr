import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category, CATEGORIES, IdeaCriteria, IdeaPage, IdeaSort, IdeaStatus, IdeaService } from '@cullr/api';
import { RouterLink } from '@angular/router';
import { Badge, Button, Checkbox, Chip, EmptyState, Pagination, Select, Skeleton, Table, Tabs, TextField, TabItem } from '@cullr/components';
import { CaptureIdeaDialogService } from '../../core/capture/capture-idea-dialog.service';
import { EditIdeaDialogService } from '../../core/edit/edit-idea-dialog.service';
import { CurateIdeaDialogService } from '../../core/curate/curate-idea-dialog.service';
import { categoryTone, statusTone } from '../../core/ideas/tones';
import { formatLogged } from '../../core/ideas/format-logged';

const SEARCH_DELAY_MS = 300;

@Component({
  selector: 'app-ideas-page',
  imports: [Badge, Button, Checkbox, Chip, EmptyState, Pagination, RouterLink, Select, Skeleton, Table, Tabs, TextField],
  template: `
    <div class="page-header">
      <div>
        <h1>Ideas</h1>
        @if (data(); as d) {
          <p class="subtitle">{{ subtitle(d) }}</p>
        }
      </div>
      <div class="cluster"><cu-button variant="primary" (click)="capture.open()">Capture idea</cu-button></div>
    </div>
    <cu-tabs label="Idea status" [items]="tabs()" [value]="status()" (valueChange)="onStatus($event)" />
    <div class="cluster cluster--between" style="margin: var(--space-4) 0;">
      <div class="cluster">
        @for (c of categoryNames; track c) {
          <cu-chip [pressed]="categories().includes(c)" (pressedChange)="toggleCategory(c, $event)">{{ c }}</cu-chip>
        }
      </div>
      <div class="cluster">
        <cu-text-field name="search" label="Search ideas" placeholder="Search ideas" [value]="searchText()" (valueChange)="onSearch($event)" />
        <cu-select name="sort" label="Sort" [inline]="true" [options]="sortOptions" [value]="sort()" (valueChange)="onSort($event)" />
      </div>
    </div>
    @if (failed()) {
      <cu-empty-state [error]="true" title="Ideas couldn't load">
        Something went wrong fetching the idea log. Check your connection and try again.
        <cu-button actions variant="primary" (click)="load()">Try again</cu-button>
        <cu-button actions routerLink="/today">Back to Today</cu-button>
      </cu-empty-state>
    } @else if (data(); as d) {
      @if (d.items.length === 0 && !filtersActive()) {
        <cu-empty-state title="No ideas yet">
          Capture your first idea and it will show up here, ready to critique and curate.
          <cu-button actions variant="primary" (click)="capture.open()">Capture idea</cu-button>
        </cu-empty-state>
      } @else if (d.items.length === 0) {
        <cu-empty-state title="No ideas match these filters">
          Nothing in the log matches your search and filters. Clear the filters to see everything.
          <cu-button actions (click)="clearFilters()">Clear filters</cu-button>
        </cu-empty-state>
      } @else {
        @if (selected().size) {
          <div class="cluster cluster--between selection-bar" style="padding: var(--space-3) var(--space-4); background: var(--color-accent-subtle); border-radius: var(--radius-md); margin-bottom: var(--space-4);">
            <span class="text-label" role="status">
              {{ selected().size.toLocaleString('en-CA') }} selected@if (allSelected() && d.total > d.items.length) { · every idea in this list}
              @if (selected().size > maxCurate) { · Select up to 5 ideas to curate }
            </span>
            <div class="cluster">
              <cu-button [disabled]="selected().size > maxCurate" (click)="curate.open([...selected()])">Curate selected</cu-button>
              <cu-button>Archive selected</cu-button>
              <cu-button (click)="selected.set(emptySelection)">Clear selection</cu-button>
            </div>
          </div>
        }
        <cu-table caption="Ideas">
          <thead>
            <tr>
              <th scope="col"><cu-checkbox label="Select all" [labelHidden]="true" [checked]="allSelected()" (checkedChange)="selectAll($event, d.allIds)" /></th>
              <th scope="col">Idea</th>
              <th scope="col">Status</th>
              <th scope="col">Logged</th>
              <th scope="col" class="num">Score</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (idea of d.items; track idea.id) {
              <tr [attr.aria-selected]="selected().has(idea.id)">
                <td><cu-checkbox [label]="'Select ' + idea.title" [labelHidden]="true" [checked]="selected().has(idea.id)" (checkedChange)="toggle(idea.id, $event)" /></td>
                <td>
                  <div class="list__title"><a [routerLink]="['/ideas', idea.id]">{{ idea.title }}</a></div>
                  <div class="list__meta"><cu-badge [tone]="categoryTone[idea.category]">{{ idea.category }}</cu-badge></div>
                </td>
                <td><cu-badge [tone]="statusTone[idea.status]">{{ idea.status }}</cu-badge></td>
                <td>{{ logged(idea.loggedAt) }}</td>
                <td class="num">{{ idea.score ?? '–' }}</td>
                <td class="row-actions">
                  <cu-button (click)="edit.open(idea.id)">Edit</cu-button>
                  <cu-button>Archive</cu-button>
                </td>
              </tr>
            }
          </tbody>
        </cu-table>
        <cu-pagination [total]="d.total" [pageSize]="d.pageSize" [page]="page()" (pageChange)="onPage($event)" />
      }
    } @else {
      <div aria-busy="true">
        @for (n of [1, 2, 3, 4, 5]; track n) {
          <div style="margin-bottom: var(--space-4);"><cu-skeleton width="70%" /><cu-skeleton width="40%" /></div>
        }
      </div>
    }
  `,
})
export class IdeasPage {
  private readonly ideas = inject(IdeaService);
  private readonly router = inject(Router);
  protected readonly capture = inject(CaptureIdeaDialogService);
  protected readonly edit = inject(EditIdeaDialogService);
  protected readonly curate = inject(CurateIdeaDialogService);

  protected readonly maxCurate = 5;
  protected readonly emptySelection = new Set<string>();
  protected readonly selected = signal<ReadonlySet<string>>(this.emptySelection);
  protected readonly allSelected = computed(() => {
    const ids = this.data()?.allIds ?? [];
    return ids.length > 0 && ids.every((id) => this.selected().has(id));
  });

  protected readonly categoryNames = CATEGORIES;
  protected readonly categoryTone = categoryTone;
  protected readonly statusTone = statusTone;
  protected readonly sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'score', label: 'Score' },
    { value: 'status', label: 'Status' },
  ];

  protected readonly status = signal('All');
  protected readonly categories = signal<Category[]>([]);
  protected readonly sort = signal<IdeaSort>('newest');
  protected readonly query = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q') ?? '');
  protected readonly searchText = signal(this.query());
  protected readonly page = signal(1);
  protected readonly data = signal<IdeaPage | null>(null);
  protected readonly failed = signal(false);
  protected readonly tabs = signal<TabItem[]>(this.tabItems(null));
  private request = 0;

  constructor() {
    effect(() => {
      this.status();
      this.categories();
      this.sort();
      this.query();
      this.page();
      this.capture.version();
      this.edit.version();
      this.curate.version();
      untracked(() => {
        this.selected.set(new Set());
        void this.load();
      });
    });
    effect((onCleanup) => {
      const text = this.searchText().trim();
      if (text === this.query()) return;
      const timer = setTimeout(() => {
        this.page.set(1);
        this.query.set(text);
        void this.router.navigate([], { queryParams: { q: text || null }, queryParamsHandling: 'merge', replaceUrl: true });
      }, SEARCH_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected filtersActive(): boolean {
    return this.status() !== 'All' || this.categories().length > 0 || this.query() !== '';
  }

  protected onStatus(value: string): void {
    this.page.set(1);
    this.status.set(value);
  }

  protected toggleCategory(category: Category, pressed: boolean): void {
    this.page.set(1);
    this.categories.update((all) => (pressed ? [...all, category] : all.filter((c) => c !== category)));
  }

  protected onSort(value: string): void {
    this.page.set(1);
    this.sort.set(value as IdeaSort);
  }

  protected onSearch(value: string): void {
    this.searchText.set(value);
  }

  protected onPage(page: number): void {
    this.page.set(page);
  }

  protected toggle(id: string, checked: boolean): void {
    this.selected.update((all) => {
      const next = new Set(all);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  protected selectAll(checked: boolean, ids: string[]): void {
    this.selected.set(checked ? new Set(ids) : this.emptySelection);
  }

  protected clearFilters(): void {
    this.page.set(1);
    this.status.set('All');
    this.categories.set([]);
    this.searchText.set('');
    this.query.set('');
    void this.router.navigate([], { queryParams: { q: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected async load(): Promise<void> {
    const request = ++this.request;
    this.failed.set(false);
    this.data.set(null);
    const criteria: IdeaCriteria = {
      status: this.status() === 'All' ? undefined : (this.status() as IdeaStatus),
      categories: this.categories(),
      sort: this.sort(),
      query: this.query(),
      page: this.page(),
    };
    try {
      const data = await this.ideas.list(criteria);
      if (request !== this.request) return;
      this.data.set(data);
      this.tabs.set(this.tabItems(data));
    } catch {
      if (request === this.request) this.failed.set(true);
    }
  }

  protected subtitle(d: IdeaPage): string {
    if (d.items.length === 0 && this.filtersActive()) return `${d.summary.quarter.toLocaleString('en-CA')} logged · 0 match filters`;
    if (d.counts.All === 0 && !this.filtersActive()) return '0 ideas logged';
    const n = (value: number) => value.toLocaleString('en-CA');
    return `${n(d.summary.quarter)} logged this quarter · ${n(d.summary.active)} active · ${n(d.summary.archived)} archived`;
  }

  protected logged(ms: number): string {
    return formatLogged(ms);
  }

  private tabItems(data: IdeaPage | null): TabItem[] {
    const names = ['All', 'Logged', 'Critiquing', 'Curating', 'Building'] as const;
    return names.map((value) => ({ value, label: value, count: value === 'All' && data ? data.counts.All : undefined }));
  }
}
