import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'cu-badge',
  host: { style: 'display: contents' },
  template: `<span [class]="classes()"><ng-content /></span>`,
})
export class Badge {
  readonly tone = input<'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'solid' | 'count'>('neutral');

  protected readonly classes = computed(() => (this.tone() === 'neutral' ? 'badge' : `badge badge--${this.tone()}`));
}
