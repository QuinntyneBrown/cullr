import { Component, input, model } from '@angular/core';

@Component({
  selector: 'cu-textarea',
  host: { style: 'display: contents' },
  template: `
    <label class="field">
      <span class="field__label">{{ label() }}</span>
      <textarea
        class="textarea"
        [id]="name()"
        [rows]="rows()"
        [attr.placeholder]="placeholder() || null"
        [attr.maxlength]="maxlength()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? name() + '-error' : null"
      ></textarea>
      @if (error()) {
        <span class="field__error" [id]="name() + '-error'">{{ error() }}</span>
      }
      @if (maxlength()) {
        <span class="field__counter">{{ value().length }} / {{ maxlength() }}</span>
      }
    </label>
  `,
})
export class Textarea {
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly rows = input(3);
  readonly placeholder = input('');
  readonly maxlength = input<number>();
  readonly error = input('');
  readonly value = model('');
}
