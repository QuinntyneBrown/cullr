import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@cullr/api';
import { ResetPasswordPage } from './reset-password';

describe('ResetPasswordPage', () => {
  let isResetLinkValid: ReturnType<typeof vi.fn>;
  let resetPassword: ReturnType<typeof vi.fn>;

  const render = async (url = '/reset-password?token=abc') => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: AuthService, useValue: { isResetLinkValid, resetPassword } },
      ],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(ResetPasswordPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };
  const fill = (el: HTMLElement, id: string, value: string) => {
    const input = el.querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = async (fixture: { whenStable(): Promise<unknown> }, el: HTMLElement) => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  beforeEach(() => {
    isResetLinkValid = vi.fn().mockResolvedValue(true);
    resetPassword = vi.fn();
  });

  it('Given a valid reset link, When the page opens, Then the new password form is shown', async () => {
    const { el } = await render();

    expect(isResetLinkValid).toHaveBeenCalledWith('abc');
    expect(el.querySelector('h1')?.textContent).toBe('Choose a new password');
    expect(el.querySelector('#password')).not.toBeNull();
    expect(el.querySelector('#confirm')).not.toBeNull();
    expect(el.querySelector('form button[type="submit"]')?.textContent?.trim()).toBe('Reset password');
  });

  it('Given the link is being checked, When the page opens, Then a loading skeleton is shown', async () => {
    isResetLinkValid.mockReturnValue(new Promise(() => {}));
    const { el } = await render();

    expect(el.querySelector('[aria-busy="true"] .skeleton')).not.toBeNull();
    expect(el.querySelector('form')).toBeNull();
  });

  it('Given an expired or missing link, When the page opens, Then it says so and offers a new link', async () => {
    isResetLinkValid.mockResolvedValue(false);
    const { el } = await render();

    expect(el.querySelector('[role="alert"] .alert__title')?.textContent).toBe('This reset link has expired');
    expect(el.querySelector('a.btn--primary')?.getAttribute('href')).toBe('/forgot-password');
    expect(el.querySelector('form')).toBeNull();
  });

  it('Given the passwords differ, When submitted, Then a mismatch error is shown and nothing is sent', async () => {
    const { fixture, el } = await render();

    fill(el, 'password', 'a long enough passphrase');
    fill(el, 'confirm', 'something else entirely');
    await submit(fixture, el);

    expect(resetPassword).not.toHaveBeenCalled();
    expect(el.querySelector('.form-summary .alert__title')?.textContent).toBe('Fix 1 error to continue');
    expect(el.querySelector('#confirm-error')?.textContent).toBe("Passwords don't match");
  });

  it('Given matching passwords, When submitted, Then the request is in flight', async () => {
    resetPassword.mockReturnValue(new Promise(() => {}));
    const { fixture, el } = await render();

    fill(el, 'password', 'a long enough passphrase');
    fill(el, 'confirm', 'a long enough passphrase');
    await submit(fixture, el);

    expect(resetPassword).toHaveBeenCalledWith('abc', 'a long enough passphrase');
    expect(el.querySelector('form button[type="submit"]')?.textContent?.trim()).toBe('Resetting…');
  });

  it('Given the server rejects the password policy, When it responds, Then the message shows under the new password', async () => {
    resetPassword.mockResolvedValue({ outcome: 'rejected', errors: { password: 'Use at least 12 characters' } });
    const { fixture, el } = await render();

    fill(el, 'password', 'short');
    fill(el, 'confirm', 'short');
    await submit(fixture, el);

    expect(el.querySelector('#password-error')?.textContent).toBe('Use at least 12 characters');
    expect(el.querySelector('form')).not.toBeNull();
  });

  it('Given the link expired meanwhile, When submitted, Then the expired state is shown', async () => {
    resetPassword.mockResolvedValue({ outcome: 'invalid-link' });
    const { fixture, el } = await render();

    fill(el, 'password', 'a long enough passphrase');
    fill(el, 'confirm', 'a long enough passphrase');
    await submit(fixture, el);

    expect(el.querySelector('[role="alert"] .alert__title')?.textContent).toBe('This reset link has expired');
  });

  it('Given the reset succeeds, When it completes, Then Password reset with a Sign in link is shown', async () => {
    resetPassword.mockResolvedValue({ outcome: 'ok' });
    const { fixture, el } = await render();

    fill(el, 'password', 'a long enough passphrase');
    fill(el, 'confirm', 'a long enough passphrase');
    await submit(fixture, el);

    expect(el.querySelector('h1')?.textContent).toBe('Password reset');
    expect(el.querySelector('a.btn--primary')?.getAttribute('href')).toBe('/sign-in');
    expect(el.querySelector('form')).toBeNull();
  });
});
