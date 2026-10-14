import { Component, input, model } from '@angular/core';

@Component({
  selector: 'cu-text-field',
  host: { style: 'display: contents' },
  template: `
    <label class="field">
      <span class="field__label">{{ label() }}</span>
      <input
        class="input"
        [id]="name()"
        [type]="type()"
        [attr.autocomplete]="autocomplete()"
        [readOnly]="readonly()"
        [attr.maxlength]="maxlength()"
        [attr.placeholder]="placeholder() || null"
        [attr.inputmode]="inputmode()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? name() + '-error' : null"
      />
      @if (error()) {
        <span class="field__error" [id]="name() + '-error'">{{ error() }}</span>
      }
      @if (maxlength()) {
        <span class="field__counter">{{ value().length }} / {{ maxlength() }}</span>
      }
    </label>
  `,
})
export class TextField {
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password'>('text');
  readonly autocomplete = input<string>();
  readonly readonly = input(false);
  readonly maxlength = input<number>();
  readonly placeholder = input('');
  readonly inputmode = input<'numeric'>();
  readonly error = input('');
  readonly value = model('');
}
