import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CATEGORIES, IdeaDetail, IdeaService } from '@cullr/api';
import { Alert, Button, Dialog, Select, TextField, Textarea, ToastService } from '@cullr/components';
import { EditIdeaDialogService } from './edit-idea-dialog.service';

@Component({
  selector: 'app-edit-idea-dialog',
  imports: [Alert, Button, Dialog, Select, TextField, Textarea],
  template: `
    @if (dialog.id()) {
      <form (submit)="submit($event)" novalidate>
        <cu-dialog title="Edit idea" description="Editing updates the idea everywhere it appears." (closed)="dialog.close()">
          @if (loadFailed()) {
            <cu-alert title="Couldn't load this idea">Check your connection and try again.</cu-alert>
          } @else if (loaded()) {
            @if (changed()) {
              <cu-alert title="This idea changed" tone="warning">
                It was changed since you opened this dialog. Review the current values, or overwrite them with your edits.
                <div class="cluster" style="margin-top: var(--space-2);">
                  <cu-button (click)="review()">Review</cu-button>
                  <cu-button (click)="send(true)">Overwrite</cu-button>
                </div>
              </cu-alert>
            } @else if (summary().length) {
              <cu-alert [title]="'Fix ' + summary().length + (summary().length === 1 ? ' error' : ' errors') + ' before saving'" [summary]="true">
                <ul style="margin: 0; padding-left: 1.2em;">
                  @for (item of summary(); track item.id) {
                    <li><a [href]="'#' + item.id">{{ item.message }}</a></li>
                  }
                </ul>
              </cu-alert>
            } @else if (failed()) {
              <cu-alert title="Couldn't save changes">Your edits are kept. Check your connection and try again.</cu-alert>
            }
            <cu-text-field name="title" label="Title" [maxlength]="120" [(value)]="title" [readonly]="saving()" [error]="errors()['title'] ?? ''" />
            <cu-textarea name="summary" label="Summary" [maxlength]="1000" [(value)]="text" [error]="errors()['summary'] ?? ''" />
            <cu-select name="category" label="Category" [options]="categories" [(value)]="category" [error]="errors()['category'] ?? ''" />
            <cu-text-field name="score" label="Score (1 to 10)" inputmode="numeric" [(value)]="score" [readonly]="saving()" [error]="errors()['score'] ?? ''" />
            <cu-textarea name="strengths" label="Strengths" [maxlength]="1000" [(value)]="strengths" [error]="errors()['strengths'] ?? ''" />
            <cu-textarea name="risks" label="Risks" [maxlength]="1000" [(value)]="risks" [error]="errors()['risks'] ?? ''" />
            <cu-textarea name="nextStep" label="Next step" [maxlength]="1000" [(value)]="nextStep" [error]="errors()['nextStep'] ?? ''" />
          }
          <div footer style="display: contents;">
            <cu-button (click)="dialog.close()">Cancel</cu-button>
            <cu-button variant="primary" type="submit" [busy]="saving()" [disabled]="!loaded()">{{ submitLabel() }}</cu-button>
          </div>
        </cu-dialog>
      </form>
    }
  `,
})
export class EditIdeaDialog {
  protected readonly dialog = inject(EditIdeaDialogService);
  private readonly ideas = inject(IdeaService);
  private readonly toast = inject(ToastService);

  protected readonly categories = [...CATEGORIES];
  protected readonly title = signal('');
  protected readonly text = signal('');
  protected readonly category = signal<string>(CATEGORIES[0]);
  protected readonly score = signal('');
  protected readonly strengths = signal('');
  protected readonly risks = signal('');
  protected readonly nextStep = signal('');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);
  protected readonly loaded = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly changed = signal<IdeaDetail | null>(null);
  private version = 0;

  protected readonly summary = computed(() =>
    Object.entries(this.errors()).map(([id, message]) => ({ id, message })),
  );
  protected readonly submitLabel = computed(() =>
    this.saving() ? 'Saving…' : this.failed() ? 'Try again' : 'Save changes',
  );

  constructor() {
    effect(() => {
      const id = this.dialog.id();
      untracked(() => void this.load(id));
    });
  }

  private async load(id: string | null): Promise<void> {
    this.loaded.set(false);
    this.loadFailed.set(false);
    this.failed.set(false);
    this.changed.set(null);
    this.errors.set({});
    if (!id) return;
    try {
      this.fill(await this.ideas.get(id));
      this.loaded.set(true);
    } catch {
      this.loadFailed.set(true);
    }
  }

  private fill(idea: IdeaDetail): void {
    this.title.set(idea.title);
    this.text.set(idea.summary);
    this.category.set(idea.category);
    this.score.set(idea.score === null ? '' : String(idea.score));
    this.strengths.set(idea.strengths);
    this.risks.set(idea.risks);
    this.nextStep.set(idea.nextStep);
    this.version = idea.version;
  }

  protected review(): void {
    this.fill(this.changed()!);
    this.changed.set(null);
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving() || !this.loaded()) return;
    const errors: Record<string, string> = {};
    if (!this.title().trim()) errors['title'] = 'Enter a title for this idea';
    const score = this.score().trim();
    if (score && !(/^\d+$/.test(score) && +score >= 1 && +score <= 10)) errors['score'] = 'Enter a whole number from 1 to 10';
    this.errors.set(errors);
    if (Object.keys(errors).length) return;
    await this.send(false);
  }

  protected async send(overwrite: boolean): Promise<void> {
    if (this.saving()) return;
    if (overwrite) this.version = this.changed()!.version;
    this.failed.set(false);
    this.changed.set(null);
    this.saving.set(true);
    const title = this.title().trim();
    const result = await this.ideas.update(
      this.dialog.id()!,
      {
        title,
        summary: this.text().trim(),
        category: this.category(),
        score: this.score().trim() || null,
        strengths: this.strengths(),
        risks: this.risks(),
        nextStep: this.nextStep(),
      },
      this.version,
      overwrite,
    );
    this.saving.set(false);
    switch (result.outcome) {
      case 'ok':
        this.toast.show({ kind: 'success', title: 'Idea updated', message: `“${title}” was saved.` });
        this.dialog.saved();
        break;
      case 'rejected':
        this.errors.set(result.errors);
        break;
      case 'changed':
        this.changed.set(result.current);
        break;
      default:
        this.failed.set(true);
    }
  }
}
