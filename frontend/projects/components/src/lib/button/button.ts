import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'cu-button',
  imports: [RouterLink],
  host: { style: 'display: contents' },
  template: `
    @if (routerLink(); as link) {
      <a [class]="classes()" [routerLink]="link"><ng-content /></a>
    } @else {
      <button
        [class]="classes()"
        [type]="type()"
        [disabled]="disabled() || busy()"
        [attr.aria-busy]="busy() ? 'true' : null"
      >
        <ng-content />
      </button>
    }
  `,
})
export class Button {
  readonly variant = input<'default' | 'primary' | 'link'>('default');
  readonly block = input(false);
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly routerLink = input<string>();

  protected readonly classes = computed(() =>
    ['btn', this.variant() !== 'default' && `btn--${this.variant()}`, this.block() && 'btn--block']
      .filter(Boolean)
      .join(' '),
  );
}
