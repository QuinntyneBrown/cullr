import { Component, input, model } from '@angular/core';

@Component({
  selector: 'cu-checkbox',
  host: { style: 'display: contents' },
  template: `
    <label class="choice">
      <input type="checkbox" [checked]="checked()" (change)="checked.set($any($event.target).checked)" />
      <span class="choice__text" [class.visually-hidden]="labelHidden()">{{ label() }}</span>
    </label>
  `,
})
export class Checkbox {
  readonly label = input.required<string>();
  readonly labelHidden = input(false);
  readonly checked = model(false);
}
