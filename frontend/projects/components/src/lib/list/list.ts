import { Component, input } from '@angular/core';

export interface ListItem {
  title: string;
  meta: string;
}

@Component({
  selector: 'cu-list',
  template: `
    <ul class="list">
      @for (item of items(); track $index) {
        <li class="list__item">
          <div class="list__body">
            <div class="list__title">{{ item.title }}</div>
            <div class="list__meta">{{ item.meta }}</div>
          </div>
        </li>
      }
    </ul>
  `,
})
export class List {
  readonly items = input.required<ListItem[]>();
}
