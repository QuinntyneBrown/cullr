import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavItem, SidebarNavigation, SkipLink } from '@cullr/components';

@Component({
  selector: 'app-authenticated-shell',
  imports: [RouterOutlet, SidebarNavigation, SkipLink],
  template: `
    <cu-skip-link target="main" />
    <div class="sidebar-layout">
      <cu-sidebar-navigation [items]="items">
        <a class="topbar__brand" href="/">Cullr</a>
      </cu-sidebar-navigation>
      <div>
        <main id="main" class="container"><router-outlet /></main>
        <footer class="footer">Cullr · personal idea curation</footer>
      </div>
    </div>
  `,
})
export class AuthenticatedShell {
  protected readonly items: NavItem[] = [
    { label: 'Today', path: '/today' },
    { label: 'Ideas', path: '/ideas' },
    { label: 'Curated', path: '/curated' },
    { label: 'Archive', path: '/archive' },
    { label: 'Settings', path: '/settings' },
  ];
}
