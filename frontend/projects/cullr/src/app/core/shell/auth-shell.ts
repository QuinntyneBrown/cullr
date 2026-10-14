import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Card, SkipLink, TopBar } from '@cullr/components';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterOutlet, Card, SkipLink, TopBar],
  template: `
    <cu-skip-link target="main" />
    <cu-top-bar><span class="topbar__brand">Cullr</span></cu-top-bar>
    <main id="main" class="auth-layout">
      <div cuCard class="auth-card"><router-outlet /></div>
    </main>
  `,
})
export class AuthShell {}
