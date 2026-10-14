import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'cu-breadcrumb',
  imports: [RouterLink],
  template: `
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        @for (item of items(); track $index; let last = $last) {
          @if (last || !item.link) {
            <li [attr.aria-current]="last ? 'page' : null">{{ item.label }}</li>
          } @else {
            <li><a [routerLink]="item.link">{{ item.label }}</a></li>
          }
        }
      </ol>
    </nav>
  `,
})
export class Breadcrumb {
  readonly items = input.required<BreadcrumbItem[]>();
}
