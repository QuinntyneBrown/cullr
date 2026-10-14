import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '@cullr/api';
import { Button, NavItem, SidebarNavigation, SkipLink } from '@cullr/components';
import { CaptureIdeaDialog } from '../capture/capture-idea-dialog';
import { EditIdeaDialog } from '../edit/edit-idea-dialog';
import { CurateIdeaDialog } from '../curate/curate-idea-dialog';

@Component({
  selector: 'app-authenticated-shell',
  imports: [RouterOutlet, Button, CaptureIdeaDialog, EditIdeaDialog, CurateIdeaDialog, SidebarNavigation, SkipLink],
  template: `
    <cu-skip-link target="main" />
    <div class="sidebar-layout">
      <cu-sidebar-navigation [items]="items">
        <a class="topbar__brand" href="/">Cullr</a>
        <cu-button variant="link" (click)="signOut()">Sign out</cu-button>
      </cu-sidebar-navigation>
      <div>
        <main id="main" class="container"><router-outlet /></main>
        <footer class="footer">Cullr · personal idea curation</footer>
      </div>
    </div>
    <app-capture-idea-dialog />
    <app-edit-idea-dialog />
    <app-curate-idea-dialog />
  `,
})
export class AuthenticatedShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/sign-in');
  }

  protected readonly items: NavItem[] = [
    { label: 'Today', path: '/today' },
    { label: 'Ideas', path: '/ideas' },
    { label: 'Curated', path: '/curated' },
    { label: 'Archive', path: '/archive' },
    { label: 'Settings', path: '/settings' },
  ];
}
