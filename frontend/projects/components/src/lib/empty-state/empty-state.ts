import { Component, input } from '@angular/core';

@Component({
  selector: 'cu-empty-state',
  template: `
    <div class="empty">
      <h2 class="empty__title">{{ title() }}</h2>
      <p class="empty__text"><ng-content /></p>
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
}
