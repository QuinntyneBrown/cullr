import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { IdeaPage, IdeaService } from '@cullr/api';
import { CaptureIdeaDialogService } from '../../core/capture/capture-idea-dialog.service';
import { CurateIdeaDialogService } from '../../core/curate/curate-idea-dialog.service';
import { EditIdeaDialogService } from '../../core/edit/edit-idea-dialog.service';
import { IdeasPage } from './ideas';

const row = (over: object = {}) => ({
  id: 'a', title: 'Porch Light', summary: '', category: 'Toronto & GTA', score: 9, status: 'Building', loggedAt: Date.now(), ...over,
});
const page = (over: Partial<IdeaPage> = {}): IdeaPage => ({
  items: [row(), row({ id: 'b', title: 'Vestry', score: null, status: 'Curating', category: 'Faith & ministry', loggedAt: Date.parse('2025-03-02T15:00:00Z') })],
  page: 1, pageSize: 50, total: 2,
  counts: { All: 214, Logged: 100, Critiquing: 50, Curating: 40, Building: 24 },
  summary: { quarter: 214, active: 10, archived: 3 },
  ...over,
} as IdeaPage);

describe('IdeasPage', () => {
  let list: ReturnType<typeof vi.fn>;

  const render = async (url = '/ideas') => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }]), { provide: IdeaService, useValue: { list } }],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(IdeasPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };
  const button = (el: HTMLElement, text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
  const last = () => list.mock.lastCall![0];

  afterEach(() => vi.useRealTimers());

  it('Given ideas exist, When the page opens, Then the summary, status tabs with counts and a table of ideas are shown', async () => {
    list = vi.fn().mockResolvedValue(page());
    const { el } = await render();

    expect(el.querySelector('h1')?.textContent).toBe('Ideas');
    expect(el.querySelector('.subtitle')?.textContent).toBe('214 logged this quarter · 10 active · 3 archived');
    expect(el.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain('All');
    expect(el.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain('214');
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Porch Light');
    expect(rows[0].textContent).toContain('Toronto & GTA');
    expect(rows[0].textContent).toContain('Building');
    expect(rows[0].textContent).toContain('Today,');
    expect(rows[1].textContent).toContain('Mar 2');
    expect(rows[1].querySelector('td.num')?.textContent?.trim()).toBe('–');
    expect(last()).toEqual({ status: undefined, categories: [], sort: 'newest', query: '', page: 1 });
  });

  it('Given the list is loading, When the page opens, Then skeleton rows are shown', async () => {
    list = vi.fn().mockReturnValue(new Promise(() => {}));
    const { el } = await render();

    expect(el.querySelector('[aria-busy="true"] .skeleton')).not.toBeNull();
    expect(el.querySelector('table')).toBeNull();
  });

  it('Given no ideas exist, When the page opens, Then an empty state is shown', async () => {
    list = vi.fn().mockResolvedValue(page({ items: [], total: 0, counts: { All: 0, Logged: 0, Critiquing: 0, Curating: 0, Building: 0 }, summary: { quarter: 0, active: 0, archived: 0 } }));
    const { el } = await render();

    expect(el.querySelector('.empty__title')?.textContent?.trim()).toBe('No ideas yet');
    expect(el.querySelector('.subtitle')?.textContent).toBe('0 ideas logged');
  });

  it('Given the list cannot load, When Try again is pressed, Then it loads again', async () => {
    list = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(page());
    const { fixture, el } = await render();

    expect(el.querySelector('.empty--error .empty__title')?.textContent?.trim()).toBe("Ideas couldn't load");
    button(el, 'Try again').click();
    await fixture.whenStable();

    expect(el.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('Given a status tab, a category chip and a sort are chosen, When they change, Then the list is requested with them and the first page', async () => {
    list = vi.fn().mockResolvedValue(page());
    const { fixture, el } = await render();

    button(el, 'Critiquing').click();
    await fixture.whenStable();
    button(el, 'Engineering').click();
    await fixture.whenStable();
    button(el, 'Photography').click();
    await fixture.whenStable();
    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = 'score';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(last()).toEqual({ status: 'Critiquing', categories: ['Engineering', 'Photography'], sort: 'score', query: '', page: 1 });
  });

  it('Given filters match nothing, When the list returns empty, Then a no-results state clears the filters', async () => {
    list = vi.fn().mockImplementation(async (c: { categories: string[] }) => (c.categories.length ? page({ items: [], total: 0 }) : page()));
    const { fixture, el } = await render();

    button(el, 'Engineering').click();
    await fixture.whenStable();

    expect(el.querySelector('.empty__title')?.textContent?.trim()).toBe('No ideas match these filters');
    expect(el.querySelector('.subtitle')?.textContent).toBe('214 logged · 0 match filters');
    button(el, 'Clear filters').click();
    await fixture.whenStable();
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('Given the owner types in search, When typing pauses, Then the query is requested once and kept in the address', async () => {
    list = vi.fn().mockResolvedValue(page());
    const { fixture, el } = await render();
    vi.useFakeTimers();
    const input = el.querySelector('#search') as HTMLInputElement;
    const calls = list.mock.calls.length;

    input.value = 'porch';
    input.dispatchEvent(new Event('input'));
    input.value = 'porch light';
    input.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(299);
    expect(list.mock.calls.length).toBe(calls);
    await vi.advanceTimersByTimeAsync(2);
    vi.useRealTimers();
    await fixture.whenStable();

    expect(list.mock.calls.length).toBe(calls + 1);
    expect(last().query).toBe('porch light');
    expect(TestBed.inject(Router).url).toBe('/ideas?q=porch%20light');
  });

  it('Given the address carries a query, When the page opens, Then the search box and request use it', async () => {
    list = vi.fn().mockResolvedValue(page());
    const { el } = await render('/ideas?q=vestry');

    expect((el.querySelector('#search') as HTMLInputElement).value).toBe('vestry');
    expect(last().query).toBe('vestry');
  });

  it('Given more than one page, When the next page is chosen, Then that page is requested', async () => {
    list = vi.fn().mockResolvedValue(page({ total: 120 }));
    const { fixture, el } = await render();

    (el.querySelector('button[aria-label="Next page"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(last().page).toBe(2);
  });

  it('Given an idea is captured, When the dialog reports it, Then the list reloads', async () => {
    list = vi.fn().mockResolvedValue(page());
    const { fixture, el } = await render();

    button(el, 'Capture idea').click();
    expect(TestBed.inject(CaptureIdeaDialogService).isOpen()).toBe(true);
    TestBed.inject(CaptureIdeaDialogService).captured();
    await fixture.whenStable();

    expect(list).toHaveBeenCalledTimes(2);
  });

  it('Given a row, When the title is shown, Then it links to the idea', async () => {
    list = vi.fn().mockResolvedValue(page());
    const { el } = await render();

    expect(el.querySelector('tbody tr a')?.getAttribute('href')).toBe('/ideas/a');
  });

  it('Given a row, When Edit is pressed, Then the Edit dialog opens for it, and the list reloads after a save', async () => {
    list = vi.fn().mockResolvedValue(page());
    const { fixture, el } = await render();

    button(el, 'Edit').click();
    expect(TestBed.inject(EditIdeaDialogService).id()).toBe('a');
    TestBed.inject(EditIdeaDialogService).saved();
    await fixture.whenStable();

    expect(list).toHaveBeenCalledTimes(2);
  });

  describe('selection (L2-011)', () => {
    const checkbox = (el: HTMLElement, label: string) =>
      Array.from(el.querySelectorAll('label.choice')).find((l) => l.textContent?.trim() === label)!.querySelector('input') as HTMLInputElement;
    const bar = (el: HTMLElement) => el.querySelector('.selection-bar');
    const tick = async (fixture: { whenStable(): Promise<unknown> }, input: HTMLInputElement) => {
      input.click();
      await fixture.whenStable();
    };
    const many = (n: number) => Array.from({ length: n }, (_, i) => row({ id: `id${i}`, title: `Idea ${i}` }));

    it('Given no selection, When the page opens, Then no bar is shown', async () => {
      list = vi.fn().mockResolvedValue(page());
      const { el } = await render();

      expect(bar(el)).toBeNull();
    });

    it('Given a row is ticked, When selected, Then the bar shows the count and the three actions', async () => {
      list = vi.fn().mockResolvedValue(page());
      const { fixture, el } = await render();

      await tick(fixture, checkbox(el, 'Select Porch Light'));

      expect(bar(el)?.textContent).toContain('1 selected');
      expect(button(el, 'Curate selected')).toBeDefined();
      expect(button(el, 'Archive selected')).toBeDefined();
      expect(button(el, 'Clear selection')).toBeDefined();
      expect(el.querySelector('tbody tr')?.getAttribute('aria-selected')).toBe('true');
    });

    it('Given Select all, When ticked, Then every listed idea across pages is selected and the bar says so', async () => {
      list = vi.fn().mockResolvedValue(page({ items: many(2) as never, total: 52, allIds: Array.from({ length: 52 }, (_, i) => `id${i}`) }));
      const { fixture, el } = await render();

      await tick(fixture, checkbox(el, 'Select all'));

      expect(bar(el)?.textContent).toContain('52 selected');
      expect(bar(el)?.textContent).toContain('every idea in this list');
      expect(checkbox(el, 'Select Idea 0').checked).toBe(true);
    });

    it('Given a selection, When Clear selection is pressed, Then the bar disappears and no row is selected', async () => {
      list = vi.fn().mockResolvedValue(page());
      const { fixture, el } = await render();
      await tick(fixture, checkbox(el, 'Select Porch Light'));

      button(el, 'Clear selection').click();
      await fixture.whenStable();

      expect(bar(el)).toBeNull();
      expect(checkbox(el, 'Select Porch Light').checked).toBe(false);
    });

    it('Given more than 5 selected, When the bar shows, Then Curate selected is disabled with the explanation', async () => {
      list = vi.fn().mockResolvedValue(page({ items: many(6) as never, total: 6, allIds: many(6).map((i) => i.id) }));
      const { fixture, el } = await render();

      await tick(fixture, checkbox(el, 'Select all'));

      expect(button(el, 'Curate selected').disabled).toBe(true);
      expect(bar(el)?.textContent).toContain('Select up to 5 ideas to curate');
    });

    it('Given 5 or fewer selected, When the bar shows, Then Curate selected is enabled', async () => {
      list = vi.fn().mockResolvedValue(page({ items: many(5) as never, total: 5, allIds: many(5).map((i) => i.id) }));
      const { fixture, el } = await render();

      await tick(fixture, checkbox(el, 'Select all'));

      expect(button(el, 'Curate selected').disabled).toBe(false);
      expect(bar(el)?.textContent).not.toContain('Select up to 5 ideas to curate');
    });

    it('Given ideas are selected, When Curate selected is pressed, Then the curate dialog opens for them', async () => {
      list = vi.fn().mockResolvedValue(page());
      const { fixture, el } = await render();
      await tick(fixture, checkbox(el, 'Select Porch Light'));
      await tick(fixture, checkbox(el, 'Select Vestry'));

      button(el, 'Curate selected').click();

      expect(TestBed.inject(CurateIdeaDialogService).ids()).toEqual(['a', 'b']);
    });

    it('Given ideas are curated, When the dialog reports it, Then the list reloads and the selection clears', async () => {
      list = vi.fn().mockResolvedValue(page());
      const { fixture, el } = await render();
      await tick(fixture, checkbox(el, 'Select Porch Light'));

      TestBed.inject(CurateIdeaDialogService).saved();
      await fixture.whenStable();

      expect(list).toHaveBeenCalledTimes(2);
      expect(bar(el)).toBeNull();
    });
  });
});
