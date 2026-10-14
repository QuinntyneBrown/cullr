import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@cullr/api';
import { ForgotPasswordPage } from './forgot-password';

describe('ForgotPasswordPage', () => {
  let forgotPassword: ReturnType<typeof vi.fn>;

  const render = async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { forgotPassword } }],
    });
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };
  const submitWith = async (fixture: { whenStable(): Promise<unknown> }, el: HTMLElement, email: string) => {
    const input = el.querySelector('#email') as HTMLInputElement;
    input.value = email;
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  beforeEach(() => {
    forgotPassword = vi.fn();
  });

  it('Given the owner forgot the password, When the page opens, Then an email form is shown', async () => {
    const { el } = await render();

    expect(el.querySelector('h1')?.textContent).toBe('Forgot your password?');
    expect(el.querySelector('#email')).not.toBeNull();
    expect(el.querySelector('form button[type="submit"]')?.textContent?.trim()).toBe('Send reset link');
    expect(el.querySelector('a.btn--link')?.getAttribute('href')).toBe('/sign-in');
  });

  it('Given a malformed email, When submitted, Then an error is shown and nothing is sent', async () => {
    const { fixture, el } = await render();

    await submitWith(fixture, el, 'nope');

    expect(forgotPassword).not.toHaveBeenCalled();
    expect(el.querySelector('.form-summary .alert__title')?.textContent).toBe('Fix 1 error to continue');
    expect(el.querySelector('#email-error')?.textContent).toBe('Enter an email address like name@example.com');
  });

  it('Given a valid email, When submitted, Then the request is in flight with a disabled-looking button', async () => {
    forgotPassword.mockReturnValue(new Promise(() => {}));
    const { fixture, el } = await render();

    await submitWith(fixture, el, 'owner@cullr.app');

    expect(forgotPassword).toHaveBeenCalledWith('owner@cullr.app');
    expect(el.querySelector('form button[type="submit"]')?.textContent?.trim()).toBe('Sending…');
    expect(el.querySelector('form button[type="submit"]')?.getAttribute('aria-busy')).toBe('true');
  });

  it('Given the request succeeds, When it completes, Then the Check your email confirmation is shown', async () => {
    forgotPassword.mockResolvedValue({ outcome: 'ok' });
    const { fixture, el } = await render();

    await submitWith(fixture, el, 'owner@cullr.app');

    expect(el.querySelector('h1')?.textContent).toBe('Check your email');
    expect(el.textContent).toContain('It expires in 60 minutes.');
    expect(el.querySelector('.dialog__icon--info')).not.toBeNull();
    expect(el.querySelector('a.btn--primary')?.getAttribute('href')).toBe('/sign-in');
    expect(el.querySelector('form')).toBeNull();
  });

  it('Given the service is unreachable, When submitted, Then an error is shown, the email is kept and Try again is offered', async () => {
    forgotPassword.mockResolvedValue({ outcome: 'unreachable' });
    const { fixture, el } = await render();

    await submitWith(fixture, el, 'owner@cullr.app');

    expect(el.querySelector('[role="alert"] .alert__title')?.textContent).toBe("Couldn't send the reset link");
    expect((el.querySelector('#email') as HTMLInputElement).value).toBe('owner@cullr.app');
    expect(el.querySelector('form button[type="submit"]')?.textContent?.trim()).toBe('Try again');
  });
});
