import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@cullr/api';
import { authGuard } from './auth.guard';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

describe('authGuard', () => {
  const run = (signedIn: boolean, url: string) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isSignedIn: async () => signedIn } }],
    });
    TestBed.inject(Router);
    return TestBed.runInInjectionContext(() => authGuard({} as never, { url } as never));
  };

  it('Given a signed-in owner, When a protected route is requested, Then it is allowed', async () => {
    expect(await run(true, '/')).toBe(true);
  });

  it('Given a signed-out visitor, When a protected route is requested, Then they are sent to Sign in with a return to that page', async () => {
    const result = await run(false, '/ideas?x=1');

    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe('/sign-in?returnUrl=%2Fideas%3Fx%3D1');
  });

  it('Given a signed-out visitor, When Today is requested, Then they are sent to plain Sign in', async () => {
    const result = await run(false, '/');

    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe('/sign-in');
  });
});

describe('unauthorizedInterceptor', () => {
  let navigate: ReturnType<typeof vi.fn>;
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate, url: '/ideas' } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  const fail = (url: string, status: number) => {
    http.get(url).subscribe({ error: () => {} });
    backend.expectOne(url).flush({}, { status, statusText: 'x' });
  };

  it('Given a 401 from an API call, When it arrives, Then the owner is sent to Sign in with the page to return to', () => {
    fail('/api/ideas', 401);

    expect(navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { returnUrl: '/ideas' } });
  });

  it('Given a 401 from an authentication call, When it arrives, Then the caller handles it', () => {
    fail('/api/auth/sign-in', 401);

    expect(navigate).not.toHaveBeenCalled();
  });
});
