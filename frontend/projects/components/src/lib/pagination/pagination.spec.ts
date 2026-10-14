import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

@Component({ imports: [Pagination], template: `<cu-pagination [total]="total" [pageSize]="50" [(page)]="page" />` })
class Host {
  total = 214;
  page = 1;
}

describe('Pagination', () => {
  const render = async (setup: (h: Host) => void = () => {}) => {
    const fixture = TestBed.createComponent(Host);
    setup(fixture.componentInstance);
    await fixture.whenStable();
    return fixture;
  };
  const buttons = (fixture: { nativeElement: HTMLElement }) =>
    Array.from(fixture.nativeElement.querySelectorAll('ul.pagination button')) as HTMLButtonElement[];

  it('Given 214 results at 50 per page, When rendered, Then it shows the range, five pages and the current page', async () => {
    const fixture = await render();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
    expect(el.querySelector('.text-caption')?.textContent).toBe('Showing 1–50 of 214');
    expect(buttons(fixture).map((b) => b.textContent)).toEqual(['‹', '1', '2', '3', '4', '5', '›']);
    expect(el.querySelector('[aria-current="page"]')?.textContent).toBe('1');
    expect(buttons(fixture)[0].getAttribute('aria-disabled')).toBe('true');
  });

  it('Given a page or Next is chosen, When clicked, Then the bound page changes and the range follows', async () => {
    const fixture = await render();

    buttons(fixture)[6].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.page).toBe(2);

    buttons(fixture)[4].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.page).toBe(4);
    expect(fixture.nativeElement.querySelector('.text-caption').textContent).toBe('Showing 151–200 of 214');
  });

  it('Given the last page, When rendered, Then Next is disabled and does nothing and the range ends at the total', async () => {
    const fixture = await render((h) => (h.page = 5));

    const next = buttons(fixture)[6];
    expect(next.getAttribute('aria-disabled')).toBe('true');
    next.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.page).toBe(5);
    expect(fixture.nativeElement.querySelector('.text-caption').textContent).toBe('Showing 201–214 of 214');
  });
});
