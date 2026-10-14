import { Component, input, model } from '@angular/core';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

let nextId = 0;

@Component({
  selector: 'cu-radio-group',
  host: { style: 'display: contents' },
  template: `
    <fieldset class="stack" style="border: 0; padding: 0; margin: 0;">
      <legend class="field__label">{{ legend() }}</legend>
      @for (option of options(); track option.value) {
        <label class="choice">
          <input type="radio" [name]="name" [value]="option.value" [checked]="value() === option.value" [disabled]="disabled()" (change)="value.set(option.value)" />
          <span class="choice__text">
            {{ option.label }}
            @if (option.description) {
              <small>{{ option.description }}</small>
            }
          </span>
        </label>
      }
    </fieldset>
  `,
})
export class RadioGroup {
  protected readonly name = `cu-radio-${nextId++}`;
  readonly legend = input.required<string>();
  readonly options = input.required<RadioOption[]>();
  readonly disabled = input(false);
  readonly value = model('');
}
