import { Component, input, model } from '@angular/core';
import { Badge } from '../badge/badge';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'cu-tabs',
  imports: [Badge],
  template: `
    <div class="tabs" role="tablist" [attr.aria-label]="label()" (keydown)="onKeydown($event)">
      @for (item of items(); track item.value) {
        <button
          class="tab"
          role="tab"
          type="button"
          [id]="'tab-' + item.value"
          [attr.aria-selected]="item.value === value()"
          [tabindex]="item.value === value() ? 0 : -1"
          (click)="value.set(item.value)"
        >
          {{ item.label }}
          @if (item.count !== undefined) {
            <cu-badge>{{ item.count }}</cu-badge>
          }
        </button>
      }
    </div>
  `,
})
export class Tabs {
  readonly label = input.required<string>();
  readonly items = input.required<TabItem[]>();
  readonly value = model('');

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.items();
    const current = items.findIndex((i) => i.value === this.value());
    const target =
      event.key === 'ArrowRight' ? (current + 1) % items.length
      : event.key === 'ArrowLeft' ? (current - 1 + items.length) % items.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : -1;
    if (target < 0) return;
    event.preventDefault();
    this.value.set(items[target].value);
    queueMicrotask(() => document.getElementById('tab-' + items[target].value)?.focus());
  }
}
