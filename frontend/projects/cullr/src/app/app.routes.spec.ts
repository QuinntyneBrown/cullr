import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@cullr/api';
import { routes } from './app.routes';

describe('Application shell', () => {
  let signedIn: boolean;
  let signOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    signedIn = true;
    signOut = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: { isSignedIn: async () => signedIn, signOut } },
      ],
    });
  });

  it('Given the owner opens the app, When the shell renders, Then skip link, primary navigation, main and footer landmarks exist', async () => {
    const harness = await RouterTestingHarness.create('/');
    const el = harness.routeNativeElement as HTMLElement;

    expect(el.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main');
    expect(el.querySelector('nav[aria-label="Primary"]')).not.toBeNull();
    expect(el.querySelector('main#main')).not.toBeNull();
    expect(el.querySelector('footer.footer')?.textContent).toContain('Cullr · personal idea curation');
  });

  it('Given a signed-out visitor, When a protected page is opened, Then they land on Sign in inside the auth shell', async () => {
    signedIn = false;
    const harness = await RouterTestingHarness.create('/');
    const el = harness.routeNativeElement as HTMLElement;

    expect(TestBed.inject(Router).url).toBe('/sign-in');
    expect(el.querySelector('header.topbar .topbar__brand')?.textContent).toContain('Cullr');
    expect(el.querySelector('main#main.auth-layout .card.auth-card h1')?.textContent).toBe('Sign in to Cullr');
  });

  it('Given a signed-in owner, When Sign out is chosen, Then the session ends and Sign in is shown', async () => {
    const harness = await RouterTestingHarness.create('/');
    signedIn = false;

    const button = Array.from((harness.routeNativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Sign out',
    )!;
    button.click();
    await harness.fixture.whenStable();

    expect(signOut).toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/sign-in');
  });

  it('Given an address that does not exist, When it is opened, Then a "Page not found" page is shown', async () => {
    const harness = await RouterTestingHarness.create('/nowhere');
    const el = harness.routeNativeElement as HTMLElement;

    expect(el.querySelector('h2.empty__title')?.textContent?.trim()).toBe('Page not found');
    expect(el.querySelector('a[href="/"]')).not.toBeNull();
  });
});
