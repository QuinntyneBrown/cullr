import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';

describe('Full-page error pages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  const open = async (url: string) => {
    const harness = await RouterTestingHarness.create(url);
    return harness.routeNativeElement as HTMLElement;
  };

  it('Given a request the owner may not make, When /403 is shown, Then Forbidden offers a link back to Today', async () => {
    const el = await open('/403');

    expect(el.querySelector('.topbar__brand')?.textContent).toContain('Cullr');
    expect(el.querySelector('h2.empty__title')?.textContent?.trim()).toBe("You can't access this page");
    expect(el.querySelector('.empty__text')?.textContent).toContain("This area isn't available for your account.");
    expect(el.querySelector('.empty__actions a.btn--primary[href="/"]')?.textContent?.trim()).toBe('Back to Today');
  });

  it('Given an unexpected failure with a reference id, When /500 is shown, Then it offers retry and prints the reference id and no internals', async () => {
    const el = await open('/500?ref=abc-123');

    expect(el.querySelector('h2.empty__title')?.textContent?.trim()).toBe('Something went wrong');
    expect(el.querySelector('.empty__text')?.textContent).toContain('Reference: abc-123');
    const actions = Array.from(el.querySelectorAll('.empty__actions .btn')).map((a) => a.textContent?.trim());
    expect(actions).toEqual(['Try again', 'Back to Today']);
    expect(el.textContent).not.toMatch(/stack|Error:/i);
  });

  it('Given no reference id, When /500 is shown, Then no reference line appears', async () => {
    const el = await open('/500');

    expect(el.textContent).not.toContain('Reference:');
  });

  it('Given the browser is offline, When /offline is shown, Then retry returns to the previous page', async () => {
    const el = await open('/offline');
    const back = vi.spyOn(TestBed.inject(Location), 'back').mockImplementation(() => {});

    expect(el.querySelector('h2.empty__title')?.textContent?.trim()).toBe("You're offline");
    (el.querySelector('.empty__actions button.btn--primary') as HTMLButtonElement).click();

    expect(back).toHaveBeenCalled();
  });

  it('Given /404, When opened, Then Page not found is shown', async () => {
    const el = await open('/404');

    expect(el.querySelector('h2.empty__title')?.textContent?.trim()).toBe('Page not found');
  });
});
