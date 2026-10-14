import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@cullr/api';
import { Alert, Button, Skeleton, TextField } from '@cullr/components';

type View = 'checking' | 'form' | 'expired' | 'done';

@Component({
  selector: 'app-reset-password-page',
  imports: [Alert, Button, Skeleton, TextField],
  template: `
    @switch (view()) {
      @case ('checking') {
        <h1 class="visually-hidden">Choose a new password</h1>
        <div class="stack" aria-busy="true">
          <cu-skeleton variant="title" width="60%" />
          <cu-skeleton variant="control" />
          <cu-skeleton variant="control" />
          <cu-skeleton variant="control" />
        </div>
      }
      @case ('expired') {
        <h1>Choose a new password</h1>
        <div style="margin-top: var(--space-4);">
          <cu-alert title="This reset link has expired">Request a new one from the sign-in page.</cu-alert>
        </div>
        <div style="margin-top: var(--space-4);">
          <cu-button variant="primary" [block]="true" routerLink="/forgot-password">Request a new link</cu-button>
        </div>
      }
      @case ('done') {
        <div class="dialog__icon dialog__icon--info" aria-hidden="true" style="margin: 0 auto var(--space-4);">
          <svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12l6 6L20 6" /></svg>
        </div>
        <h1 style="text-align: center;">Password reset</h1>
        <p class="text-muted" style="text-align: center; margin-top: var(--space-1);">Sign in with your new password.</p>
        <div style="margin-top: var(--space-6);">
          <cu-button variant="primary" [block]="true" routerLink="/sign-in">Sign in</cu-button>
        </div>
      }
      @default {
        <h1>Choose a new password</h1>
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
        } @else {
          <p class="text-muted" style="margin-top: var(--space-1);">Make it at least 12 characters.</p>
        }
        <form class="stack" style="margin-top: var(--space-6);" (submit)="submit($event)" novalidate>
          <cu-text-field name="password" label="New password" type="password" autocomplete="new-password" [(value)]="password" [readonly]="submitting()" [error]="errors().password ?? ''" />
          <cu-text-field name="confirm" label="Confirm new password" type="password" autocomplete="new-password" [(value)]="confirm" [readonly]="submitting()" [error]="errors().confirm ?? ''" />
          <cu-button variant="primary" [block]="true" type="submit" [busy]="submitting()">{{ submitting() ? 'Resetting…' : 'Reset password' }}</cu-button>
        </form>
      }
    }
  `,
})
export class ResetPasswordPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  protected readonly view = signal<View>('checking');
  protected readonly password = signal('');
  protected readonly confirm = signal('');
  protected readonly errors = signal<{ password?: string; confirm?: string }>({});
  protected readonly submitting = signal(false);
  protected readonly summary = computed(() =>
    Object.entries(this.errors()).map(([id, message]) => ({ id, message })),
  );

  async ngOnInit(): Promise<void> {
    let valid = false;
    try {
      valid = !!this.token && (await this.auth.isResetLinkValid(this.token));
    } catch {
      // An unreachable service is treated like an unusable link.
    }
    this.view.set(valid ? 'form' : 'expired');
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    if (this.password() !== this.confirm()) {
      this.errors.set({ confirm: "Passwords don't match" });
      return;
    }
    this.errors.set({});
    this.submitting.set(true);
    const result = await this.auth.resetPassword(this.token, this.password());
    this.submitting.set(false);
    if (result.outcome === 'ok') this.view.set('done');
    else if (result.outcome === 'invalid-link') this.view.set('expired');
    else this.errors.set(result.errors ?? { password: 'Could not reset the password. Try again.' });
  }
}
