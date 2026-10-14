import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IdeaDetail, IdeaService, IdeaStatus } from '@cullr/api';
import { Alert, Badge, Breadcrumb, Button, Card, DescriptionList, DialogService, EmptyState, List, Skeleton, ToastService } from '@cullr/components';
import { EditIdeaDialogService } from '../../core/edit/edit-idea-dialog.service';
import { formatLogged } from '../../core/ideas/format-logged';
import { categoryTone, statusTone } from '../../core/ideas/tones';

const NOT_WRITTEN = 'Not written yet';

@Component({
  selector: 'app-idea-detail-page',
  imports: [Alert, Badge, Breadcrumb, Button, Card, DescriptionList, EmptyState, List, Skeleton],
  template: `
    @if (failed()) {
      <h1 class="visually-hidden">Idea</h1>
      <cu-breadcrumb [items]="[{ label: 'Ideas', link: '/ideas' }, { label: 'Idea' }]" />
      <cu-empty-state [error]="true" title="This idea couldn't load">
        Something went wrong fetching this idea. Check your connection and try again.
        <cu-button actions variant="primary" (click)="load()">Try again</cu-button>
        <cu-button actions routerLink="/ideas">Back to Ideas</cu-button>
      </cu-empty-state>
    } @else if (idea(); as idea) {
      <cu-breadcrumb
        [items]="[idea.archived ? { label: 'Archive', link: '/archive' } : { label: 'Ideas', link: '/ideas' }, { label: idea.title }]"
      />
      @if (idea.archived) {
        <div style="margin: var(--space-4) 0;"><cu-alert title="Archived" tone="warning" /></div>
      }
      <div class="page-header">
        <div>
          <h1>{{ idea.title }}</h1>
          <p class="subtitle">
            <cu-badge [tone]="categoryTone[idea.category]">{{ idea.category }}</cu-badge>
            @if (idea.archived) {
              <cu-badge tone="danger">Archived</cu-badge>
            } @else {
              <cu-badge [tone]="statusTone[idea.status]">{{ idea.status }}</cu-badge>
            }
          </p>
        </div>
        <div class="cluster">
          @if (idea.archived) {
            <cu-button>Restore</cu-button>
            <cu-button>Delete permanently</cu-button>
          } @else {
            <cu-button>Curate</cu-button>
            <cu-button>Archive</cu-button>
            <cu-button variant="primary" (click)="edit.open(idea.id)">Edit idea</cu-button>
          }
        </div>
      </div>
      @if (!idea.archived) {
        @if (statusFailed()) {
          <div style="margin-bottom: var(--space-4);">
            <cu-alert title="Couldn't update the status">
              The status is unchanged.
              <div class="cluster" style="margin-top: var(--space-2);"><cu-button (click)="retryStatus()">Try again</cu-button></div>
            </cu-alert>
          </div>
        }
        <div class="cluster status-control" style="margin-bottom: var(--space-4);">
          <cu-button (click)="setStatus('Building')">Mark as Building</cu-button>
          <cu-button (click)="setStatus('Built')">Mark as Built</cu-button>
        </div>
      }
      <div class="grid">
        <section cuCard class="span-full" style="grid-column: span 8; overflow-wrap: anywhere;" [style.opacity]="idea.archived ? 0.85 : null">
          <h2 class="card__title">Summary</h2>
          <p>{{ idea.summary || 'No summary yet' }}</p>
          @if (idea.archived) {
            <p class="text-caption" style="margin-top: var(--space-4);">Editing is turned off for archived ideas. Restore it first to make changes.</p>
          } @else {
            <h3 style="margin-top: var(--space-6);">Critique notes</h3>
            <cu-description-list [items]="notes(idea)" />
          }
        </section>
        <aside cuCard style="grid-column: span 4;">
          <h2 class="card__title">Status history</h2>
          <cu-list [items]="history(idea)" />
        </aside>
      </div>
    } @else {
      <h1 class="visually-hidden">Idea</h1>
      <cu-breadcrumb [items]="[{ label: 'Ideas', link: '/ideas' }, { label: 'Idea' }]" />
      <div class="page-header">
        <div><cu-skeleton variant="title" width="14rem" /><cu-skeleton width="10rem" /></div>
      </div>
      <div cuCard aria-busy="true">
        <cu-skeleton width="90%" /><cu-skeleton width="80%" /><cu-skeleton width="60%" />
      </div>
    }
  `,
})
export class IdeaDetailPage {
  private readonly ideas = inject(IdeaService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  protected readonly edit = inject(EditIdeaDialogService);

  protected readonly categoryTone = categoryTone;
  protected readonly statusTone = statusTone;
  protected readonly idea = signal<IdeaDetail | null>(null);
  protected readonly failed = signal(false);
  protected readonly statusFailed = signal(false);
  private pendingStatus: IdeaStatus | null = null;

  constructor() {
    effect(() => {
      this.edit.version();
      untracked(() => void this.load());
    });
  }

  protected async load(): Promise<void> {
    this.failed.set(false);
    try {
      this.idea.set(await this.ideas.get(this.id));
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        await this.router.navigateByUrl('/404', { replaceUrl: true });
      } else {
        this.idea.set(null);
        this.failed.set(true);
      }
    }
  }

  protected notes(idea: IdeaDetail) {
    return [
      { term: 'Strengths', description: idea.strengths || NOT_WRITTEN },
      { term: 'Risks', description: idea.risks || NOT_WRITTEN },
      { term: 'Next step', description: idea.nextStep || NOT_WRITTEN },
    ];
  }

  protected history(idea: IdeaDetail) {
    return idea.history.map((h) => ({ title: h.description, meta: formatLogged(h.at) }));
  }

  protected async setStatus(status: IdeaStatus): Promise<void> {
    if (this.idea()!.status === status) return;
    const confirmed = await this.dialogs.confirm({
      title: `Mark as ${status}?`,
      body: `“${this.idea()!.title}” will be marked as ${status} and the change is added to its status history.`,
      confirmLabel: `Mark as ${status}`,
    });
    if (!confirmed) return;
    this.pendingStatus = status;
    await this.retryStatus();
  }

  protected async retryStatus(): Promise<void> {
    this.statusFailed.set(false);
    const result = await this.ideas.setStatus(this.id, this.pendingStatus!);
    if (result.outcome === 'ok') {
      this.idea.set(result.idea);
      this.toast.show({ kind: 'success', title: 'Status updated', message: `“${result.idea.title}” is now ${result.idea.status}.` });
    } else {
      this.statusFailed.set(true);
    }
  }
}
