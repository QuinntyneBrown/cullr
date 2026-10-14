import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CuratedList, CurationService } from '@cullr/api';
import { CurateIdeaDialogService } from '../../core/curate/curate-idea-dialog.service';
import { CuratedPage } from './curated';

const item = (period: string, over: object = {}) => ({
  period,
  idea: { id: period, title: `Idea ${period}`, summary: 'A summary.', category: 'Engineering', status: 'Curating', score: 8, ...over },
});
const list = (items = [item('today'), item('week', { category: 'Toronto & GTA' })]): CuratedList =>
  ({ asOf: '2025-10-14', items, distinctIdeaCount: items.length }) as unknown as CuratedList;

describe('CuratedPage', () => {
  let getCurated: ReturnType<typeof vi.fn>;

  const render = async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CurationService, useValue: { getCurated } }],
    });
    const fixture = TestBed.createComponent(CuratedPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };
  const button = (el: HTMLElement, text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

  it('Given curated ideas, When the page opens, Then a subtitle and a card per period are shown', async () => {
    getCurated = vi.fn().mockResolvedValue(list());
    const { el } = await render();

    expect(el.querySelector('h1')?.textContent).toBe('Curated');
    expect(el.querySelector('.subtitle')?.textContent).toBe('2 ideas curated as of Tue 14 Oct');
    const cards = el.querySelectorAll('.card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Best of today');
    expect(cards[1].textContent).toContain('Best of this week');
    expect(cards[0].querySelector('a')?.getAttribute('href')).toBe('/ideas/today');
    expect(cards[0].textContent).toContain('A summary.');
    expect(cards[0].textContent).toContain('Engineering');
    expect(cards[0].textContent).toContain('Curating');
  });

  it('Given the list is loading, When the page opens, Then skeleton cards are shown', async () => {
    getCurated = vi.fn().mockReturnValue(new Promise(() => {}));
    const { el } = await render();

    expect(el.querySelector('[aria-busy="true"] .skeleton')).not.toBeNull();
  });

  it('Given nothing is curated, When the page opens, Then an empty state links to Ideas', async () => {
    getCurated = vi.fn().mockResolvedValue(list([]));
    const { el } = await render();

    expect(el.querySelector('.empty__title')?.textContent?.trim()).toBe('Nothing curated yet');
    expect(el.querySelector('.empty a')?.getAttribute('href')).toBe('/ideas');
  });

  it('Given the list cannot load, When Try again is pressed, Then it loads again', async () => {
    getCurated = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(list());
    const { fixture, el } = await render();

    expect(el.querySelector('.empty--error .empty__title')?.textContent?.trim()).toBe("Curated ideas couldn't load");
    expect(el.querySelector('.empty--error a')?.getAttribute('href')).toBe('/today');
    button(el, 'Try again').click();
    await fixture.whenStable();

    expect(el.querySelectorAll('.card').length).toBe(2);
  });

  it('Given a category with no curated ideas is chosen, When filtering, Then no-results offers Clear filters', async () => {
    getCurated = vi.fn().mockResolvedValue(list());
    const { fixture, el } = await render();

    button(el, 'Photography').click();
    await fixture.whenStable();

    expect(el.querySelector('.empty__title')?.textContent?.trim()).toBe('No curated ideas match these filters');
    button(el, 'Clear filters').click();
    await fixture.whenStable();

    expect(el.querySelectorAll('.card').length).toBe(2);
  });

  it('Given a category is chosen, When filtering, Then only matching cards remain', async () => {
    getCurated = vi.fn().mockResolvedValue(list());
    const { fixture, el } = await render();

    button(el, 'Engineering').click();
    await fixture.whenStable();

    expect(el.querySelectorAll('.card').length).toBe(1);
  });

  it('Given an idea is curated, When the dialog reports it, Then the list reloads', async () => {
    getCurated = vi.fn().mockResolvedValue(list());
    const { fixture } = await render();

    TestBed.inject(CurateIdeaDialogService).saved();
    await fixture.whenStable();

    expect(getCurated).toHaveBeenCalledTimes(2);
  });
});
