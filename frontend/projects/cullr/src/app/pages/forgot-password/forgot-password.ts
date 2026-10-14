import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '@cullr/api';
import { Alert, Button, TextField } from '@cullr/components';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-forgot-password-page',
  imports: [Alert, Button, TextField],
  template: `
    @if (sent()) {
      <div class="dialog__icon dialog__icon--info" aria-hidden="true" style="margin: 0 auto var(--space-4);">
        <svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12l6 6L20 6" /></svg>
      </div>
      <h1 style="text-align: center;">Check your email</h1>
      <p class="text-muted" style="text-align: center; margin-top: var(--space-1);">
        If {{ email() }} belongs to an account, we sent a reset link. It expires in 60 minutes.
      </p>
      <div style="margin-top: var(--space-6);">
        <cu-button variant="primary" [block]="true" routerLink="/sign-in">Back to sign in</cu-button>
      </div>
    } @else {
      <h1>Forgot your password?</h1>
      @if (error()) {
        <div style="margin-top: var(--space-4);">
          <cu-alert title="Couldn't send the reset link">The mail service didn't respond. Try again in a moment.</cu-alert>
        </div>
      } @else if (emailError()) {
        <div style="margin-top: var(--space-4);">
          <cu-alert title="Fix 1 error to continue" [summary]="true">
            <ul style="margin: 0; padding-left: 1.2em;">
              <li><a href="#email">{{ emailError() }}</a></li>
            </ul>
          </cu-alert>
        </div>
      } @else {
        <p class="text-muted" style="margin-top: var(--space-1);">Enter your email and we'll send you a reset link.</p>
      }
      <form class="stack" style="margin-top: var(--space-4);" (submit)="submit($event)" novalidate>
        <cu-text-field name="email" label="Email" type="email" autocomplete="email" [(value)]="email" [readonly]="submitting()" [error]="emailError()" />
        <cu-button variant="primary" [block]="true" type="submit" [busy]="submitting()">{{ submitLabel() }}</cu-button>
        @if (!submitting()) {
          <cu-button variant="link" routerLink="/sign-in">Back to sign in</cu-button>
        }
      </form>
    }
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);

  protected readonly email = signal('');
  protected readonly emailError = signal('');
  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal(false);
  protected readonly submitLabel = computed(() =>
    this.submitting() ? 'Sending…' : this.error() ? 'Try again' : 'Send reset link',
  );

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.error.set(false);
    if (!EMAIL_PATTERN.test(this.email().trim())) {
      this.emailError.set('Enter an email address like name@example.com');
      return;
    }
    this.emailError.set('');
    this.submitting.set(true);
    const result = await this.auth.forgotPassword(this.email().trim());
    this.submitting.set(false);
    if (result.outcome === 'ok') this.sent.set(true);
    else this.error.set(true);
  }
}
