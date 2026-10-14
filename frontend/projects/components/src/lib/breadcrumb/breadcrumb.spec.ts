import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Breadcrumb } from './breadcrumb';

@Component({
  imports: [Breadcrumb],
  template: `<cu-breadcrumb [items]="[{ label: 'Ideas', link: '/ideas' }, { label: 'Porch Light' }]" />`,
})
class Host {}

describe('Breadcrumb', () => {
  it('Given a trail, When rendered, Then ancestors link and the last item is the current page', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('nav[aria-label="Breadcrumb"] > ol.breadcrumb')).not.toBeNull();
    const link = el.querySelector('li a') as HTMLAnchorElement;
    expect(link.textContent).toBe('Ideas');
    expect(link.getAttribute('href')).toBe('/ideas');
    const current = el.querySelector('li[aria-current="page"]');
    expect(current?.textContent).toBe('Porch Light');
    expect(current?.querySelector('a')).toBeNull();
  });
});
