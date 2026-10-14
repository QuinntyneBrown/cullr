import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'cu-sidebar-navigation',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" aria-label="Primary">
      <ng-content />
      @for (item of items(); track item.path) {
        <a
          class="nav-link"
          [routerLink]="item.path"
          routerLinkActive
          ariaCurrentWhenActive="page"
          >{{ item.label }}</a
        >
      }
    </nav>
  `,
})
export class SidebarNavigation {
  readonly items = input.required<NavItem[]>();
}
