import { Component, input } from '@angular/core';

export interface DescriptionItem {
  term: string;
  description: string;
}

@Component({
  selector: 'cu-description-list',
  template: `
    <dl class="dl">
      @for (item of items(); track item.term) {
        <dt>{{ item.term }}</dt>
        <dd>{{ item.description }}</dd>
      }
    </dl>
  `,
})
export class DescriptionList {
  readonly items = input.required<DescriptionItem[]>();
}
