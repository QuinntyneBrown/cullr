import { Component, input } from '@angular/core';

@Component({
  selector: 'cu-alert',
  host: { style: 'display: contents' },
  template: `
    <div
      class="alert"
      [class.alert--danger]="tone() === 'danger'"
      [class.alert--warning]="tone() === 'warning'"
      [class.form-summary]="summary()"
      [attr.role]="tone() === 'danger' ? 'alert' : 'status'"
    >
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 4.3 2.7 18a1 1 0 0 0 .9 1.5h17a1 1 0 0 0 .9-1.5L13.7 4.3a1 1 0 0 0-1.7 0z" /></svg>
      <div class="alert__body">
        <div class="alert__title">{{ title() }}</div>
        <ng-content />
      </div>
    </div>
  `,
})
export class Alert {
  readonly title = input.required<string>();
  readonly summary = input(false);
  readonly tone = input<'danger' | 'warning'>('danger');
}
