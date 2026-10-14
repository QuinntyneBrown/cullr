import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CurateResult, CurationService } from '@cullr/api';
import { ToastService } from '@cullr/components';
import { CurateIdeaDialog } from './curate-idea-dialog';
import { CurateIdeaDialogService } from './curate-idea-dialog.service';

const ok = (over: Partial<Extract<CurateResult, { outcome: 'ok' }>> = {}): CurateResult => ({
  outcome: 'ok',
  period: 'today',
  curated: [{ id: 'a1', title: 'Porch Light' }],
  alreadyBest: [],
  displaced: [],
  ...over,
});

describe('CurateIdeaDialog', () => {
  let curate: ReturnType<typeof vi.fn>;
  let toast: { show: ReturnType<typeof vi.fn> };
  let navigateByUrl: ReturnType<typeof vi.fn>;

  const render = async (ids = ['a1']) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CurationService, useValue: { curate } },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    const service = TestBed.inject(CurateIdeaDialogService);
    service.open(ids);
    const fixture = TestBed.createComponent(CurateIdeaDialog);
    await fixture.whenStable();
    return { fixture, service, el: fixture.nativeElement as HTMLElement };
  };
  const choose = async (fixture: { whenStable(): Promise<unknown> }, el: HTMLElement, index: number) => {
    (el.querySelectorAll('input[type="radio"]')[index] as HTMLInputElement).click();
    await fixture.whenStable();
  };
  const submit = async (fixture: { whenStable(): Promise<unknown> }, el: HTMLElement) => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  beforeEach(() => {
    curate = vi.fn().mockResolvedValue(ok());
    toast = { show: vi.fn() };
    navigateByUrl = vi.fn();
  });

  it('Given an idea, When the dialog opens, Then it offers the four periods with carry-over rules and the first preselected', async () => {
    const { el } = await render();

    expect(el.querySelector('h2')?.textContent).toBe('Curate idea');
    const labels = Array.from(el.querySelectorAll('.choice__text')).map((t) => t.textContent?.trim());
    expect(labels).toEqual([
      'Best of today Shown on Curated and at the top of Today',
      'Best of this week Carries over until Sunday',
      'Best of this month Carries over until month end',
      'Best of the year so far The strongest idea curated this year',
    ]);
    const radios = Array.from(el.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(radios.map((r) => r.checked)).toEqual([true, false, false, false]);
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Curate');
  });

  it('Given a period is chosen, When confirmed, Then the idea is curated, the dialog closes and a toast with a View curated action is shown', async () => {
    curate.mockResolvedValue(ok({ period: 'week' }));
    const { fixture, service, el } = await render();
    await choose(fixture, el, 1);

    await submit(fixture, el);

    expect(curate).toHaveBeenCalledWith(['a1'], 'week');
    expect(service.ids()).toBeNull();
    expect(service.version()).toBe(1);
    const toastOptions = toast.show.mock.calls[0][0];
    expect(toastOptions).toMatchObject({ kind: 'info', title: 'Added to Curated', autoDismissMs: 8000 });
    expect(toastOptions.message).toBe('“Porch Light” now shows on the Curated page as best of this week.');
    toastOptions.action.run();
    expect(navigateByUrl).toHaveBeenCalledWith('/curated');
  });

  it('Given the period was full, When confirmed, Then the success toast names the idea that stopped being best of it', async () => {
    curate.mockResolvedValue(ok({ displaced: [{ id: 'z', title: 'Old Idea' }] }));
    const { fixture, el } = await render();

    await submit(fixture, el);

    expect(toast.show.mock.calls[0][0]).toMatchObject({
      kind: 'success',
      title: 'Best of today!',
      message: '“Porch Light” is now best of today. “Old Idea” stepped aside.',
    });
  });

  it('Given the idea is already best of the period, When confirmed, Then the owner is told and the dialog closes', async () => {
    curate.mockResolvedValue(ok({ curated: [], alreadyBest: [{ id: 'a1', title: 'Porch Light' }] }));
    const { fixture, service, el } = await render();

    await submit(fixture, el);

    expect(toast.show.mock.calls[0][0]).toMatchObject({ kind: 'info', title: 'Already best of today', message: '“Porch Light” is already best of today.' });
    expect(service.ids()).toBeNull();
  });

  it('Given several ideas, When curated together, Then they are sent as one request and the toast counts them', async () => {
    curate.mockResolvedValue(ok({ curated: [{ id: 'a1', title: 'A' }, { id: 'a2', title: 'B' }] }));
    const { fixture, el } = await render(['a1', 'a2']);
    expect(el.textContent).toContain('2 ideas');

    await submit(fixture, el);

    expect(curate).toHaveBeenCalledWith(['a1', 'a2'], 'today');
    expect(toast.show.mock.calls[0][0].message).toBe('2 ideas now show on the Curated page as best of today.');
  });

  it('Given the save is in flight, When confirmed, Then the primary action is busy and disabled', async () => {
    let finish!: (r: CurateResult) => void;
    curate.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { fixture, el } = await render();

    await submit(fixture, el);
    const button = el.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(button.textContent?.trim()).toBe('Curating…');
    expect(button.disabled).toBe(true);
    finish(ok());
    await fixture.whenStable();
  });

  it('Given the save fails, When confirmed, Then the dialog stays open with a failure message, the choice kept and Try again offered', async () => {
    curate.mockResolvedValue({ outcome: 'failed' });
    const { fixture, service, el } = await render();
    await choose(fixture, el, 2);

    await submit(fixture, el);

    expect(service.ids()).toEqual(['a1']);
    expect(el.textContent).toContain("Couldn't curate this idea");
    expect((el.querySelectorAll('input[type="radio"]')[2] as HTMLInputElement).checked).toBe(true);
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Try again');
    expect(toast.show).not.toHaveBeenCalled();
  });
});
