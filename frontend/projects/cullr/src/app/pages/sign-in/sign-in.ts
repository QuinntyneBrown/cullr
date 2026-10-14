import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@cullr/api';
import { Alert, Button, Skeleton, TextField } from '@cullr/components';

@Component({
  selector: 'app-sign-in-page',
  imports: [Alert, Button, Skeleton, TextField],
  template: `
    @if (checking()) {
      <h1 class="visually-hidden">Sign in to Cullr</h1>
      <div class="stack" aria-busy="true">
        <cu-skeleton variant="title" width="60%" />
        <cu-skeleton width="80%" />
        <cu-skeleton variant="control" />
        <cu-skeleton variant="control" />
        <cu-skeleton variant="control" />
      </div>
    } @else {
      <h1>Sign in to Cullr</h1>
      @if (summary().length) {
        <div style="margin-top: var(--space-4);">
          <cu-alert [title]="'Fix ' + summary().length + (summary().length === 1 ? ' error' : ' errors') + ' to continue'" [summary]="true">
            <ul style="margin: 0; padding-left: 1.2em;">
              @for (item of summary(); track item.id) {
                <li><a [href]="'#' + item.id">{{ item.message }}</a></li>
              }
            </ul>
          </cu-alert>
        </div>
      } @else if (problem() === 'rejected') {
        <div style="margin-top: var(--space-4);"><cu-alert title="Email or password is incorrect" /></div>
      } @else if (problem() === 'unreachable') {
        <div style="margin-top: var(--space-4);">
          <cu-alert title="Sign-in service is unreachable">
            Check your connection and try again. If this keeps happening, the service may be down.
          </cu-alert>
        </div>
      } @else {
        <p class="text-muted" style="margin-top: var(--space-1);">Review, critique and curate today's ideas.</p>
      }
      <form class="stack" style="margin-top: var(--space-4);" (submit)="submit($event)" novalidate>
        <cu-text-field name="email" label="Email" type="email" autocomplete="email" [(value)]="email" [readonly]="submitting()" [error]="errors().email ?? ''" />
        <cu-text-field name="password" label="Password" type="password" autocomplete="current-password" [(value)]="password" [readonly]="submitting()" [error]="errors().password ?? ''" />
        <cu-button variant="primary" [block]="true" type="submit" [busy]="submitting()">{{ submitLabel() }}</cu-button>
        @if (!submitting()) {
          <cu-button variant="link" routerLink="/forgot-password">Forgot your password?</cu-button>
        }
      </form>
    }
  `,
})
export class SignInPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly checking = signal(true);
  protected readonly submitting = signal(false);
  protected readonly problem = signal<'rejected' | 'unreachable' | null>(null);
  protected readonly errors = signal<{ email?: string; password?: string }>({});
  protected readonly email = signal('');
  protected readonly password = signal('');

  protected readonly summary = computed(() =>
    Object.entries(this.errors()).map(([id, message]) => ({ id, message })),
  );
  protected readonly submitLabel = computed(() =>
    this.submitting() ? 'Signing in…' : this.problem() === 'unreachable' ? 'Try again' : 'Sign in',
  );

  async ngOnInit(): Promise<void> {
    try {
      if (await this.auth.isSignedIn()) {
        await this.router.navigateByUrl(this.returnUrl());
        return;
      }
    } catch {
      // The form still works; sign-in reports an unreachable service itself.
    }
    this.checking.set(false);
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.problem.set(null);
    const errors: { email?: string; password?: string } = {};
    if (!this.email().trim()) errors.email = 'Enter your email';
    if (!this.password()) errors.password = 'Enter your password';
    this.errors.set(errors);
    if (Object.keys(errors).length) return;

    this.submitting.set(true);
    const result = await this.auth.signIn(this.email(), this.password());
    if (result.outcome === 'ok') {
      await this.router.navigateByUrl(this.returnUrl());
      return;
    }
    this.problem.set(result.outcome === 'unreachable' ? 'unreachable' : 'rejected');
    this.submitting.set(false);
  }

  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && /^\/(?![/\\])/.test(url) ? url : '/';
  }
}
