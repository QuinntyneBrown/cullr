import { Component, input } from '@angular/core';

@Component({
  selector: 'cu-empty-state',
  template: `
    <div class="empty" [class.empty--error]="error()">
      <div class="empty__icon" aria-hidden="true"><ng-content select="[icon]" /></div>
      <h2 class="empty__title">{{ title() }}</h2>
      <p class="empty__text"><ng-content /></p>
      <div class="empty__actions"><ng-content select="[actions]" /></div>
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly error = input(false);
}
