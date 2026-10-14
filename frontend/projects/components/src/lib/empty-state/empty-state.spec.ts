import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `<cu-empty-state title="Page not found"><span>Go back to Today.</span></cu-empty-state>`,
})
class Host {}

describe('EmptyState', () => {
  it('Given a title and content, When rendered, Then it shows the title as a heading and the projected text', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h2.empty__title')?.textContent?.trim()).toBe('Page not found');
    expect(el.querySelector('.empty__text')?.textContent?.trim()).toBe('Go back to Today.');
  });
});
