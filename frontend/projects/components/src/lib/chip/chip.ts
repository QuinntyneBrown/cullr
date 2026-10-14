import { Component, model } from '@angular/core';

@Component({
  selector: 'cu-chip',
  host: { style: 'display: contents' },
  template: `
    <button class="chip" type="button" [attr.aria-pressed]="pressed()" (click)="pressed.set(!pressed())">
      <ng-content />
    </button>
  `,
})
export class Chip {
  readonly pressed = model(false);
}
