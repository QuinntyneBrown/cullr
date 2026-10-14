import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@cullr/api';
import { SignInPage } from './sign-in';

describe('SignInPage', () => {
  let signIn: ReturnType<typeof vi.fn>;
  let isSignedIn: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const render = async (url = '/sign-in') => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }]), { provide: AuthService, useValue: { signIn, isSignedIn } }],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SignInPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };
  const type = (el: HTMLElement, id: string, value: string) => {
    const input = el.querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = async (fixture: { whenStable(): Promise<unknown> }, el: HTMLElement) => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  beforeEach(() => {
    signIn = vi.fn();
    isSignedIn = vi.fn().mockResolvedValue(false);
  });

  it('Given the owner is not signed in, When the page opens, Then the sign-in form is shown', async () => {
    const { el } = await render();

    expect(el.querySelector('h1')?.textContent).toBe('Sign in to Cullr');
    expect(el.querySelector('#email')).not.toBeNull();
    expect(el.querySelector('#password')).not.toBeNull();
    expect(el.querySelector('form button[type="submit"]')?.textContent?.trim()).toBe('Sign in');
    expect(el.querySelector('a.btn--link')?.getAttribute('href')).toBe('/forgot-password');
  });

  it('Given the session is still being checked, When the page opens, Then a loading skeleton replaces the form', async () => {
    isSignedIn.mockReturnValue(new Promise(() => {}));
    const { el } = await render();

    expect(el.querySelector('[aria-busy="true"] .skeleton')).not.toBeNull();
    expect(el.querySelector('form')).toBeNull();
  });

  it('Given a signed-in owner, When /sign-in opens, Then they are redirected to Today', async () => {
    isSignedIn.mockResolvedValue(true);
    await render();

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('Given valid credentials, When submitted, Then the owner is signed in and taken to Today', async () => {
    signIn.mockResolvedValue({ outcome: 'ok' });
    const { fixture, el } = await render();

    type(el, 'email', 'owner@cullr.app');
    type(el, 'password', 'pw');
    await submit(fixture, el);

    expect(signIn).toHaveBeenCalledWith('owner@cullr.app', 'pw');
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('Given a return URL, When sign-in succeeds, Then the owner returns to that page', async () => {
    signIn.mockResolvedValue({ outcome: 'ok' });
    const { fixture, el } = await render('/sign-in?returnUrl=%2Fideas');

    type(el, 'email', 'owner@cullr.app');
    type(el, 'password', 'pw');
    await submit(fixture, el);

    expect(navigateByUrl).toHaveBeenCalledWith('/ideas');
  });

  it('Given an off-site return URL, When sign-in succeeds, Then it is ignored and the owner goes to Today', async () => {
    signIn.mockResolvedValue({ outcome: 'ok' });
    const { fixture, el } = await render('/sign-in?returnUrl=%2F%2Fevil.example');

    type(el, 'email', 'owner@cullr.app');
    type(el, 'password', 'pw');
    await submit(fixture, el);

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('Given the request is in flight, When submitting, Then the button is busy and disabled and the fields are read-only', async () => {
    signIn.mockReturnValue(new Promise(() => {}));
    const { fixture, el } = await render();

    type(el, 'email', 'owner@cullr.app');
    type(el, 'password', 'pw');
    await submit(fixture, el);

    const button = el.querySelector('form button[type="submit"]') as HTMLButtonElement;
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Signing in…');
    expect((el.querySelector('#email') as HTMLInputElement).readOnly).toBe(true);
    expect((el.querySelector('#password') as HTMLInputElement).readOnly).toBe(true);
  });

  it('Given wrong credentials, When submitted, Then one generic message is shown', async () => {
    signIn.mockResolvedValue({ outcome: 'rejected' });
    const { fixture, el } = await render();

    type(el, 'email', 'owner@cullr.app');
    type(el, 'password', 'bad');
    await submit(fixture, el);

    expect(el.querySelector('.alert__title')?.textContent).toBe('Email or password is incorrect');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('Given an empty email and password, When submitted, Then inline errors and a summary are shown and no request is sent', async () => {
    const { fixture, el } = await render();

    await submit(fixture, el);

    expect(signIn).not.toHaveBeenCalled();
    expect(el.querySelector('.alert.form-summary .alert__title')?.textContent).toBe('Fix 2 errors to continue');
    expect(el.querySelector('#email-error')?.textContent).toBe('Enter your email');
    expect(el.querySelector('#password-error')?.textContent).toBe('Enter your password');
    expect(el.querySelector('#password')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('Given the service is unreachable, When submitted, Then the error and a Try again action are shown and the email is kept', async () => {
    signIn.mockResolvedValue({ outcome: 'unreachable' });
    const { fixture, el } = await render();

    type(el, 'email', 'owner@cullr.app');
    type(el, 'password', 'pw');
    await submit(fixture, el);

    expect(el.querySelector('.alert__title')?.textContent).toBe('Sign-in service is unreachable');
    expect(el.querySelector('form button[type="submit"]')?.textContent?.trim()).toBe('Try again');
    expect((el.querySelector('#email') as HTMLInputElement).value).toBe('owner@cullr.app');
  });
});
