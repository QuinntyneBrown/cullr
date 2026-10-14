import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkipLink } from '@cullr/components';

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, SkipLink],
  template: `
    <cu-skip-link target="main" />
    <header class="topbar"><a class="topbar__brand" routerLink="/">Cullr</a></header>
    <main
      id="main"
      class="container container--narrow"
      style="min-height: calc(100dvh - var(--layout-topbar-height)); display: grid; place-items: center"
    >
      <ng-content />
    </main>
  `,
})
export class ErrorPage {}
