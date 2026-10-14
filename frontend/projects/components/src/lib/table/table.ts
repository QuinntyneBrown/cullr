import { Component, input } from '@angular/core';

@Component({
  selector: 'cu-table',
  template: `
    <div class="table-wrap">
      <table class="table">
        <caption class="visually-hidden">{{ caption() }}</caption>
        <ng-content />
      </table>
    </div>
  `,
})
export class Table {
  readonly caption = input.required<string>();
}
