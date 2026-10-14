import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState, SkipLink } from '@cullr/components';

@Component({
  selector: 'app-not-found',
  imports: [EmptyState, RouterLink, SkipLink],
  template: `
    <cu-skip-link target="main" />
    <header class="topbar"><a class="topbar__brand" routerLink="/">Cullr</a></header>
    <main id="main" class="container">
      <cu-empty-state title="Page not found">
        That address doesn't exist. <a routerLink="/">Go to Today</a>.
      </cu-empty-state>
    </main>
  `,
})
export class NotFound {}
