import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });
  afterEach(() => http.verify());

  it('Given credentials, When signing in succeeds, Then it posts them and reports ok', async () => {
    const result = auth.signIn('a@b.co', 'secret');
    const req = http.expectOne('/api/auth/sign-in');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.co', password: 'secret' });
    req.flush({});

    expect(await result).toEqual({ outcome: 'ok' });
  });

  it('Given the server rejects the credentials, When signing in, Then the outcome is rejected', async () => {
    const result = auth.signIn('a@b.co', 'bad');
    http.expectOne('/api/auth/sign-in').flush({ title: 'Email or password is incorrect' }, { status: 401, statusText: 'x' });

    expect(await result).toEqual({ outcome: 'rejected' });
  });

  it('Given the service cannot be reached, When signing in, Then the outcome is unreachable', async () => {
    const result = auth.signIn('a@b.co', 'x');
    http.expectOne('/api/auth/sign-in').error(new ProgressEvent('error'));

    expect(await result).toEqual({ outcome: 'unreachable' });
  });

  it('Given the session endpoint, When the owner is signed in or not, Then it answers true or false', async () => {
    const signedIn = auth.isSignedIn();
    http.expectOne('/api/auth/session').flush({});
    expect(await signedIn).toBe(true);

    const signedOut = auth.isSignedIn();
    http.expectOne('/api/auth/session').flush({}, { status: 401, statusText: 'x' });
    expect(await signedOut).toBe(false);
  });

  it('Given a signed-in owner, When signing out, Then it posts to sign-out', async () => {
    const result = auth.signOut();
    const req = http.expectOne('/api/auth/sign-out');
    expect(req.request.method).toBe('POST');
    req.flush({});
    await result;
  });

  it('Given an email, When requesting a reset link, Then it posts it and reports ok; a failing service is unreachable', async () => {
    const ok = auth.forgotPassword('a@b.co');
    http.expectOne('/api/auth/forgot-password').flush({});
    expect(await ok).toEqual({ outcome: 'ok' });

    const failed = auth.forgotPassword('a@b.co');
    http.expectOne('/api/auth/forgot-password').flush({}, { status: 503, statusText: 'x' });
    expect(await failed).toEqual({ outcome: 'unreachable' });
  });

  it('Given a reset link token, When it is checked, Then 410 means the link is not valid', async () => {
    const good = auth.isResetLinkValid('t1');
    http.expectOne('/api/auth/reset-password?token=t1').flush({});
    expect(await good).toBe(true);

    const bad = auth.isResetLinkValid('t2');
    http.expectOne('/api/auth/reset-password?token=t2').flush({}, { status: 410, statusText: 'x' });
    expect(await bad).toBe(false);
  });

  it('Given a new password, When resetting, Then ok, policy errors and an invalid link are told apart', async () => {
    const ok = auth.resetPassword('t', 'a long enough password');
    const req = http.expectOne('/api/auth/reset-password');
    expect(req.request.body).toEqual({ token: 't', password: 'a long enough password' });
    req.flush({});
    expect(await ok).toEqual({ outcome: 'ok' });

    const weak = auth.resetPassword('t', 'short');
    http.expectOne('/api/auth/reset-password').flush({ errors: { password: 'Use at least 12 characters' } }, { status: 400, statusText: 'x' });
    expect(await weak).toEqual({ outcome: 'rejected', errors: { password: 'Use at least 12 characters' } });

    const gone = auth.resetPassword('t', 'a long enough password');
    http.expectOne('/api/auth/reset-password').flush({}, { status: 410, statusText: 'x' });
    expect(await gone).toEqual({ outcome: 'invalid-link' });
  });
});
