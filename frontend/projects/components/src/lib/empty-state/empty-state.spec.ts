import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `<cu-empty-state title="Page not found"><span>Go back to Today.</span></cu-empty-state>`,
})
class Host {}

@Component({
  imports: [EmptyState],
  template: `
    <cu-empty-state title="You're offline">
      Reconnect.
      <svg icon viewBox="0 0 24 24"><path d="M3 3" /></svg>
      <div actions><a class="btn" href="/">Back to Today</a></div>
    </cu-empty-state>
  `,
})
class HostWithIconAndActions {}

@Component({
  imports: [EmptyState],
  template: `<cu-empty-state title="Ideas couldn't load" [error]="true">Try again.</cu-empty-state>`,
})
class ErrorHost {}

describe('EmptyState', () => {
  it('Given the error variant, When rendered, Then it carries the error modifier', async () => {
    const fixture = TestBed.createComponent(ErrorHost);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.empty.empty--error')).not.toBeNull();
  });

  it('Given an icon and actions, When rendered, Then the icon is decorative and the actions sit in the actions row', async () => {
    const fixture = TestBed.createComponent(HostWithIconAndActions);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const icon = el.querySelector('.empty__icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelector('svg')).not.toBeNull();
    expect(el.querySelector('.empty__actions a.btn')?.textContent).toBe('Back to Today');
  });

  it('Given a title and content, When rendered, Then it shows the title as a heading and the projected text', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h2.empty__title')?.textContent?.trim()).toBe('Page not found');
    expect(el.querySelector('.empty__text')?.textContent?.trim()).toBe('Go back to Today.');
  });
});
