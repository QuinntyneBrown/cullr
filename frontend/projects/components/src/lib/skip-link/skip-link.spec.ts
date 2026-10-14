import { TestBed } from '@angular/core/testing';
import { SkipLink } from './skip-link';

describe('SkipLink', () => {
  it('Given a main landmark id, When rendered, Then it is a link that skips to that content', async () => {
    const fixture = TestBed.createComponent(SkipLink);
    fixture.componentRef.setInput('target', 'main');
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a.skip-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('#main');
    expect(link.textContent?.trim()).toBe('Skip to content');
  });
});
