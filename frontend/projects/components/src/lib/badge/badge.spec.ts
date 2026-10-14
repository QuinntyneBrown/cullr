import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Badge } from './badge';

@Component({ imports: [Badge], template: `<cu-badge tone="success">Building</cu-badge><cu-badge>Logged</cu-badge>` })
class Host {}

describe('Badge', () => {
  it('Given a tone, When rendered, Then the badge carries the tone class and the projected text', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const badges = fixture.nativeElement.querySelectorAll('span.badge') as NodeListOf<HTMLElement>;
    expect(badges[0].className).toBe('badge badge--success');
    expect(badges[0].textContent).toBe('Building');
    expect(badges[1].className).toBe('badge');
  });
});
