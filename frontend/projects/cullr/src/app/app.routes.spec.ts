import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('Application shell', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('Given the owner opens the app, When the shell renders, Then skip link, primary navigation, main and footer landmarks exist', async () => {
    const harness = await RouterTestingHarness.create('/');
    const el = harness.routeNativeElement as HTMLElement;

    expect(el.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main');
    expect(el.querySelector('nav[aria-label="Primary"]')).not.toBeNull();
    expect(el.querySelector('main#main')).not.toBeNull();
    expect(el.querySelector('footer.footer')?.textContent).toContain('Cullr · personal idea curation');
  });

  it('Given an address that does not exist, When it is opened, Then a "Page not found" page is shown', async () => {
    const harness = await RouterTestingHarness.create('/nowhere');
    const el = harness.routeNativeElement as HTMLElement;

    expect(el.querySelector('h2.empty__title')?.textContent?.trim()).toBe('Page not found');
    expect(el.querySelector('a[href="/"]')).not.toBeNull();
  });
});
