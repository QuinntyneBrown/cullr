import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { BestOfPeriod, CurationService } from '@cullr/api';
import { Alert, Button, Dialog, RadioGroup, ToastService } from '@cullr/components';
import { CurateIdeaDialogService } from './curate-idea-dialog.service';

const OPTIONS = [
  { value: 'today', label: 'Best of today', description: 'Shown on Curated and at the top of Today' },
  { value: 'week', label: 'Best of this week', description: 'Carries over until Sunday' },
  { value: 'month', label: 'Best of this month', description: 'Carries over until month end' },
  { value: 'year', label: 'Best of the year so far', description: 'The strongest idea curated this year' },
];
const WHEN: Record<BestOfPeriod, string> = { today: 'today', week: 'this week', month: 'this month', year: 'the year so far' };
const MILESTONE: Record<BestOfPeriod, string> = { today: 'today', week: 'the week', month: 'the month', year: 'the year so far' };

@Component({
  selector: 'app-curate-idea-dialog',
  imports: [Alert, Button, Dialog, RadioGroup],
  template: `
    @if (dialog.ids(); as ids) {
      <form (submit)="submit($event)" novalidate>
        <cu-dialog
          title="Curate idea"
          [description]="ids.length === 1 ? 'Choose which best-of list this idea joins.' : 'Choose which best-of list these ' + ids.length + ' ideas join.'"
          [tone]="failed() ? 'danger' : 'info'"
          (closed)="dialog.close()"
        >
          @if (failed()) {
            <cu-alert title="Couldn't curate this idea">The update didn't go through. Try again.</cu-alert>
          }
          <cu-radio-group legend="Curate as" [options]="options" [(value)]="period" [disabled]="saving()" />
          <div footer style="display: contents;">
            <cu-button [disabled]="saving()" (click)="dialog.close()">Cancel</cu-button>
            <cu-button variant="primary" type="submit" [busy]="saving()">{{ submitLabel() }}</cu-button>
          </div>
        </cu-dialog>
      </form>
    }
  `,
})
export class CurateIdeaDialog {
  protected readonly dialog = inject(CurateIdeaDialogService);
  private readonly curation = inject(CurationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly options = OPTIONS;
  protected readonly period = signal<string>('today');
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);
  protected readonly submitLabel = computed(() => (this.saving() ? 'Curating…' : this.failed() ? 'Try again' : 'Curate'));

  constructor() {
    effect(() => {
      this.dialog.ids();
      untracked(() => {
        this.period.set('today');
        this.failed.set(false);
      });
    });
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const ids = this.dialog.ids();
    if (this.saving() || !ids) return;
    this.failed.set(false);
    this.saving.set(true);
    const result = await this.curation.curate(ids, this.period() as BestOfPeriod);
    this.saving.set(false);
    if (result.outcome !== 'ok') {
      this.failed.set(true);
      return;
    }
    const when = WHEN[result.period];
    const first = result.curated[0] ?? result.alreadyBest[0];
    if (result.curated.length === 0) {
      this.toast.show({ kind: 'info', title: `Already best of ${when}`, message: `“${first.title}” is already best of ${when}.` });
    } else if (result.displaced.length) {
      const stepped = result.displaced.map((d) => `“${d.title}”`).join(', ');
      this.toast.show({
        kind: 'success',
        title: `Best of ${MILESTONE[result.period]}!`,
        message: `${this.names(result.curated)} ${result.curated.length === 1 ? 'is' : 'are'} now best of ${when}. ${stepped} stepped aside.`,
        action: this.viewCurated(),
        autoDismissMs: 8000,
      });
    } else {
      const subject = result.curated.length === 1 ? `“${first.title}”` : `${result.curated.length} ideas`;
      this.toast.show({
        kind: 'info',
        title: 'Added to Curated',
        message: `${subject} now ${result.curated.length === 1 ? 'shows' : 'show'} on the Curated page as best of ${when}.`,
        action: this.viewCurated(),
        autoDismissMs: 8000,
      });
    }
    this.dialog.saved();
  }

  private names(items: { title: string }[]): string {
    return items.length === 1 ? `“${items[0].title}”` : `${items.length} ideas`;
  }

  private viewCurated() {
    return { label: 'View curated', run: () => void this.router.navigateByUrl('/curated') };
  }
}
