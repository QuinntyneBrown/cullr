import { Component, input, model } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

const normalize = (options: (string | SelectOption)[]): SelectOption[] =>
  options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

@Component({
  selector: 'cu-select',
  host: { style: 'display: contents' },
  template: `
    <label class="field" [style]="inline() ? 'flex-direction: row; align-items: center; gap: var(--space-2)' : null">
      <span class="field__label">{{ label() }}</span>
      <select
        class="select"
        [class.input--sm]="inline()"
        [style.width]="inline() ? 'auto' : null"
        [id]="name()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? name() + '-error' : null"
        (change)="value.set($any($event.target).value)"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
      @if (error()) {
        <span class="field__error" [id]="name() + '-error'">{{ error() }}</span>
      }
    </label>
  `,
})
export class Select {
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<SelectOption[], (string | SelectOption)[]>({ transform: normalize });
  readonly inline = input(false);
  readonly error = input('');
  readonly value = model('');
}
