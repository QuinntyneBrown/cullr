import { Component, computed, inject, signal } from '@angular/core';
import { CATEGORIES, IdeaService } from '@cullr/api';
import { Alert, Button, Dialog, Select, TextField, Textarea, ToastService } from '@cullr/components';
import { CaptureIdeaDialogService } from './capture-idea-dialog.service';

@Component({
  selector: 'app-capture-idea-dialog',
  imports: [Alert, Button, Dialog, Select, TextField, Textarea],
  template: `
    @if (dialog.isOpen()) {
      <form (submit)="submit($event)" novalidate>
        <cu-dialog title="Capture an idea" description="Log it now. You can critique and edit it later." (closed)="dialog.close()">
          @if (summary().length) {
            <cu-alert [title]="'Fix ' + summary().length + (summary().length === 1 ? ' error' : ' errors') + ' before capturing this idea'" [summary]="true">
              <ul style="margin: 0; padding-left: 1.2em;">
                @for (item of summary(); track item.id) {
                  <li><a [href]="'#' + item.id">{{ item.message }}</a></li>
                }
              </ul>
            </cu-alert>
          } @else if (failed()) {
            <cu-alert title="Couldn't capture this idea">Your entries are kept. Check your connection and try again.</cu-alert>
          }
          <cu-text-field name="title" label="Title" [maxlength]="120" [(value)]="title" [readonly]="saving()" [error]="errors()['title'] ?? ''" />
          <cu-textarea name="summary" label="Summary" [maxlength]="1000" [(value)]="text" [error]="errors()['summary'] ?? ''" />
          <cu-select name="category" label="Category" [options]="categories" [(value)]="category" [error]="errors()['category'] ?? ''" />
          <cu-text-field name="score" label="Score (1 to 10)" inputmode="numeric" [(value)]="score" [readonly]="saving()" [error]="errors()['score'] ?? ''" />
          <div footer style="display: contents;">
            <cu-button (click)="dialog.close()">Cancel</cu-button>
            <cu-button variant="primary" type="submit" [busy]="saving()">{{ submitLabel() }}</cu-button>
          </div>
        </cu-dialog>
      </form>
    }
  `,
})
export class CaptureIdeaDialog {
  protected readonly dialog = inject(CaptureIdeaDialogService);
  private readonly ideas = inject(IdeaService);
  private readonly toast = inject(ToastService);

  protected readonly categories = [...CATEGORIES];
  protected readonly title = signal('');
  protected readonly text = signal('');
  protected readonly category = signal<string>(CATEGORIES[0]);
  protected readonly score = signal('');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);
  private captureKey = crypto.randomUUID();

  protected readonly summary = computed(() =>
    Object.entries(this.errors()).map(([id, message]) => ({ id, message })),
  );
  protected readonly submitLabel = computed(() =>
    this.saving() ? 'Capturing…' : this.failed() ? 'Try again' : 'Capture idea',
  );

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) return;
    this.failed.set(false);
    const errors: Record<string, string> = {};
    if (!this.title().trim()) errors['title'] = 'Enter a title for this idea';
    const score = this.score().trim();
    if (score && !(/^\d+$/.test(score) && +score >= 1 && +score <= 10)) errors['score'] = 'Enter a whole number from 1 to 10';
    this.errors.set(errors);
    if (Object.keys(errors).length) return;

    this.saving.set(true);
    const title = this.title().trim();
    const result = await this.ideas.capture(
      { title, summary: this.text().trim(), category: this.category(), score: score || null },
      this.captureKey,
    );
    this.saving.set(false);
    if (result.outcome === 'ok') {
      this.toast.show({ kind: 'success', title: 'Idea captured', message: `“${title}” was added to today's log.` });
      this.dialog.captured();
    } else if (result.outcome === 'rejected') {
      this.errors.set(result.errors);
    } else {
      this.failed.set(true);
    }
  }
}
