import { Component, input } from '@angular/core';

@Component({
  selector: 'cu-skip-link',
  template: `<a class="skip-link" [href]="'#' + target()">Skip to content</a>`,
})
export class SkipLink {
  readonly target = input.required<string>();
}
