import { Component, input } from '@angular/core';

@Component({
  selector: 'cu-skeleton',
  host: { style: 'display: contents' },
  template: `
    <span
      class="skeleton"
      [class.skeleton--title]="variant() === 'title'"
      [class.skeleton--text]="variant() === 'text'"
      [style.width]="width()"
      [style.height]="variant() === 'control' ? 'var(--control-height-md)' : null"
      [style.border-radius]="variant() === 'control' ? 'var(--radius-md)' : null"
    ></span>
  `,
})
export class Skeleton {
  readonly variant = input<'title' | 'text' | 'control'>('text');
  readonly width = input<string>();
}
