import { Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'cu-button',
  imports: [NgTemplateOutlet, RouterLink],
  host: { style: 'display: contents' },
  template: `
    @if (routerLink(); as link) {
      <a [class]="classes()" [routerLink]="link"><ng-container *ngTemplateOutlet="label" /></a>
    } @else {
      <button
        [class]="classes()"
        [type]="type()"
        [disabled]="disabled() || busy()"
        [attr.aria-busy]="busy() ? 'true' : null"
      >
        <ng-container *ngTemplateOutlet="label" />
      </button>
    }
    <ng-template #label><ng-content /></ng-template>
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
