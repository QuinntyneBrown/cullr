import { TestBed } from '@angular/core/testing';
import { IdeaService, TodaySummary } from '@cullr/api';
import { CaptureIdeaDialogService } from '../../core/capture/capture-idea-dialog.service';
import { CurateIdeaDialogService } from '../../core/curate/curate-idea-dialog.service';
import { TodayPage } from './today';

const idea = (over: object = {}) => ({
  id: 'a', title: 'Porch Light', summary: 'A favour board.', category: 'Toronto & GTA', score: 9,
  status: 'Building', loggedAt: Date.parse('2025-10-14T11:42:00Z'), bestOfToday: true, ...over,
});
const summary = (over: Partial<TodaySummary> = {}): TodaySummary => ({
  date: '2025-10-14', timeZone: 'America/Toronto', total: 2, best: { id: 'a', title: 'Porch Light' },
  ideas: [idea(), idea({ id: 'b', title: 'Lint Before You Leap', score: null, bestOfToday: false, status: 'Logged', category: 'Engineering' })],
  ...over,
} as TodaySummary);

describe('TodayPage', () => {
  let today: ReturnType<typeof vi.fn>;

  const render = async () => {
    TestBed.configureTestingModule({ providers: [{ provide: IdeaService, useValue: { today } }] });
    const fixture = TestBed.createComponent(TodayPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };
  const button = (el: HTMLElement, text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

  it('Given ideas were logged today, When the page opens, Then a summary line and one card per idea are shown', async () => {
    today = vi.fn().mockResolvedValue(summary());
    const { el } = await render();

    expect(el.querySelector('h1')?.textContent).toBe('Today');
    expect(el.querySelector('.subtitle')?.textContent).toBe("2 ideas logged today · Porch Light is today's best · Tue 14 Oct");
    const cards = el.querySelectorAll('.card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Best of today');
    expect(cards[0].textContent).toContain('9');
    expect(cards[0].textContent).toContain('Logged Today, 7:42 am');
    expect(cards[1].textContent).toContain('Not scored');
    expect(cards[1].textContent).not.toContain('Best of today');
  });

  it('Given the summary is loading, When the page opens, Then skeleton cards are shown', async () => {
    today = vi.fn().mockReturnValue(new Promise(() => {}));
    const { el } = await render();

    expect(el.querySelector('[aria-busy="true"] .skeleton')).not.toBeNull();
    expect(el.querySelector('.card .badge')).toBeNull();
  });

  it('Given nothing was logged today, When the page opens, Then an empty state offers to capture an idea', async () => {
    today = vi.fn().mockResolvedValue(summary({ total: 0, best: null, ideas: [] }));
    const { el } = await render();

    expect(el.querySelector('.empty__title')?.textContent?.trim()).toBe('No ideas logged yet today');
    expect(el.querySelector('.subtitle')?.textContent).toBe('0 ideas logged today · Tue 14 Oct');
  });

  it('Given the summary cannot load, When Try again is pressed, Then it loads again', async () => {
    today = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(summary());
    const { fixture, el } = await render();

    expect(el.querySelector('.empty--error .empty__title')?.textContent?.trim()).toBe("Today's ideas couldn't load");
    button(el, 'Try again').click();
    await fixture.whenStable();

    expect(el.querySelectorAll('.card').length).toBe(2);
  });

  it('Given a category filter matches nothing, When it is applied, Then a no-results state offers Clear filters', async () => {
    today = vi.fn().mockImplementation(async (category?: string) => (category ? summary({ ideas: [] }) : summary()));
    const { fixture, el } = await render();

    button(el, 'Photography').click();
    await fixture.whenStable();

    expect(today).toHaveBeenLastCalledWith('Photography');
    expect(el.querySelector('.subtitle')?.textContent).toBe('2 ideas logged today · 0 match filters · Tue 14 Oct');
    expect(el.querySelector('.empty__title')?.textContent?.trim()).toBe('No ideas match these filters');
    button(el, 'Clear filters').click();
    await fixture.whenStable();
    expect(el.querySelectorAll('.card').length).toBe(2);
  });

  it('Given the page is open, When Capture idea is pressed, Then the capture dialog opens', async () => {
    today = vi.fn().mockResolvedValue(summary());
    const { el } = await render();

    button(el, 'Capture idea').click();

    expect(TestBed.inject(CaptureIdeaDialogService).isOpen()).toBe(true);
  });

  it('Given an idea is captured, When the dialog reports it, Then today reloads', async () => {
    today = vi.fn().mockResolvedValue(summary());
    const { fixture } = await render();

    TestBed.inject(CaptureIdeaDialogService).captured();
    await fixture.whenStable();

    expect(today).toHaveBeenCalledTimes(2);
  });

  it('Given an idea card, When Curate is pressed, Then the curate dialog opens for that idea', async () => {
    today = vi.fn().mockResolvedValue(summary());
    const { el } = await render();

    Array.from(el.querySelectorAll('.card')[1].querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Curate')!.click();

    expect(TestBed.inject(CurateIdeaDialogService).ids()).toEqual(['b']);
  });

  it('Given an idea is curated, When the dialog reports it, Then today reloads', async () => {
    today = vi.fn().mockResolvedValue(summary());
    const { fixture } = await render();

    TestBed.inject(CurateIdeaDialogService).saved();
    await fixture.whenStable();

    expect(today).toHaveBeenCalledTimes(2);
  });
});
