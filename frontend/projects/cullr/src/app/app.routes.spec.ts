import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, IdeaService } from '@cullr/api';
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
        { provide: IdeaService, useValue: { today: async () => ({ date: '2025-10-14', timeZone: 'America/Toronto', total: 0, best: null, ideas: [] }) } },
      ],
    });
  });

  it('Given a signed-in owner, When the app root or /today is opened, Then Today is shown and Capture idea opens the dialog from the shell', async () => {
    const harness = await RouterTestingHarness.create('/');
    const el = harness.routeNativeElement as HTMLElement;
    await harness.fixture.whenStable();
    expect(el.querySelector('main#main h1')?.textContent).toBe('Today');

    const capture = Array.from(el.querySelectorAll('main button')).find((b) => b.textContent?.trim() === 'Capture idea') as HTMLButtonElement;
    capture.click();
    await harness.fixture.whenStable();

    expect(el.querySelector('[role="dialog"] h2')?.textContent).toBe('Capture an idea');
    await harness.navigateByUrl('/today');
    expect(el.querySelector('main#main h1')?.textContent).toBe('Today');
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
