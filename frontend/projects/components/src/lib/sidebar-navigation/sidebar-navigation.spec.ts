import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SidebarNavigation } from './sidebar-navigation';

@Component({ template: '' })
class Page {}

@Component({
  imports: [SidebarNavigation],
  template: `<cu-sidebar-navigation [items]="items" />`,
})
class Host {
  items = [
    { label: 'Today', path: '/today' },
    { label: 'Ideas', path: '/ideas' },
  ];
}

describe('SidebarNavigation', () => {
  it('Given the owner is on Ideas, When rendered, Then Ideas is the current page and Today is not', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'today', component: Page },
          { path: 'ideas', component: Page },
        ]),
      ],
    });
    await TestBed.inject(Router).navigateByUrl('/ideas');
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe('Primary');
    const links = Array.from(nav.querySelectorAll('a.nav-link'));
    expect(links.map((l) => l.textContent?.trim())).toEqual(['Today', 'Ideas']);
    expect(links.map((l) => l.getAttribute('aria-current'))).toEqual([null, 'page']);
  });
});
