import { TestBed } from '@angular/core/testing';
import { IdeaDetail, IdeaService } from '@cullr/api';
import { ToastService } from '@cullr/components';
import { EditIdeaDialog } from './edit-idea-dialog';
import { EditIdeaDialogService } from './edit-idea-dialog.service';

const detail = (over: Partial<IdeaDetail> = {}): IdeaDetail => ({
  id: 'a1', title: 'Porch Light', summary: 'A favour board.', category: 'Product', score: 9, status: 'Logged', loggedAt: 1000,
  strengths: 'Real need', risks: 'Trust', nextStep: 'Sketch it', version: 3, archived: false, history: [],
  ...over,
});

describe('EditIdeaDialog', () => {
  let get: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let toast: { show: ReturnType<typeof vi.fn> };

  const render = async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: IdeaService, useValue: { get, update } },
        { provide: ToastService, useValue: toast },
      ],
    });
    const service = TestBed.inject(EditIdeaDialogService);
    service.open('a1');
    const fixture = TestBed.createComponent(EditIdeaDialog);
    await fixture.whenStable();
    return { fixture, service, el: fixture.nativeElement as HTMLElement };
  };
  const type = (el: HTMLElement, selector: string, value: string) => {
    const input = el.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const value = (el: HTMLElement, selector: string) => (el.querySelector(selector) as HTMLInputElement).value;
  const save = async (fixture: { whenStable(): Promise<unknown> }, el: HTMLElement) => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };
  const button = (el: HTMLElement, text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

  beforeEach(() => {
    get = vi.fn().mockResolvedValue(detail());
    update = vi.fn();
    toast = { show: vi.fn() };
  });

  it('Given an idea, When the dialog opens, Then the saved values are prefilled', async () => {
    const { el } = await render();

    expect(get).toHaveBeenCalledWith('a1');
    expect(el.querySelector('h2')?.textContent).toBe('Edit idea');
    expect(value(el, '#title')).toBe('Porch Light');
    expect(value(el, '#summary')).toBe('A favour board.');
    expect(value(el, '#category')).toBe('Product');
    expect(value(el, '#score')).toBe('9');
    expect(value(el, '#strengths')).toBe('Real need');
    expect(value(el, '#risks')).toBe('Trust');
    expect(value(el, '#nextStep')).toBe('Sketch it');
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Save changes');
  });

  it('Given the idea cannot be loaded, When the dialog opens, Then a failure message is shown', async () => {
    get.mockRejectedValue(new Error('x'));
    const { el } = await render();

    expect(el.textContent).toContain("Couldn't load this idea");
  });

  it('Given an empty title and an out-of-range score, When saved, Then inline errors and a summary are shown and nothing is sent', async () => {
    const { fixture, el } = await render();
    type(el, '#title', '');
    type(el, '#score', '11');

    await save(fixture, el);

    expect(update).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Fix 2 errors before saving');
    expect(el.textContent).toContain('Enter a title for this idea');
    expect(el.textContent).toContain('Enter a whole number from 1 to 10');
  });

  it('Given valid changes, When saved, Then the busy state shows, then the dialog closes, a toast confirms and lists refresh', async () => {
    let resolve!: (value: unknown) => void;
    update.mockReturnValue(new Promise((r) => (resolve = r)));
    const { fixture, service, el } = await render();
    const version = service.version();
    type(el, '#title', 'Porch Light 2');
    type(el, '#score', '');

    await save(fixture, el);
    expect(el.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true);
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Saving…');
    expect(update).toHaveBeenCalledWith(
      'a1',
      { title: 'Porch Light 2', summary: 'A favour board.', category: 'Product', score: null, strengths: 'Real need', risks: 'Trust', nextStep: 'Sketch it' },
      3,
      false,
    );

    resolve({ outcome: 'ok', idea: detail() });
    await fixture.whenStable();

    expect(service.id()).toBeNull();
    expect(toast.show).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success', title: 'Idea updated' }));
    expect(service.version()).toBe(version + 1);
  });

  it('Given the save fails, When it is retried, Then the edits are kept and the dialog stays open', async () => {
    update.mockResolvedValueOnce({ outcome: 'failed' }).mockResolvedValueOnce({ outcome: 'ok', idea: detail() });
    const { fixture, service, el } = await render();
    type(el, '#title', 'Keep me');

    await save(fixture, el);
    expect(service.id()).toBe('a1');
    expect(el.textContent).toContain("Couldn't save changes");
    expect(value(el, '#title')).toBe('Keep me');
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Try again');

    await save(fixture, el);
    expect(service.id()).toBeNull();
  });

  it('Given the idea changed elsewhere, When saved, Then the owner can review the current values or overwrite', async () => {
    update.mockResolvedValueOnce({ outcome: 'changed', current: detail({ title: 'Newer title', version: 4 }) });
    const { fixture, service, el } = await render();
    type(el, '#title', 'My edit');

    await save(fixture, el);
    expect(el.textContent).toContain('This idea changed');
    expect(service.id()).toBe('a1');

    button(el, 'Review').click();
    await fixture.whenStable();
    expect(value(el, '#title')).toBe('Newer title');
    expect(el.textContent).not.toContain('This idea changed');

    update.mockResolvedValueOnce({ outcome: 'changed', current: detail({ title: 'Newest', version: 5 }) });
    await save(fixture, el);
    update.mockResolvedValueOnce({ outcome: 'ok', idea: detail() });
    button(el, 'Overwrite').click();
    await fixture.whenStable();

    expect(update.mock.lastCall![2]).toBe(5);
    expect(update.mock.lastCall![3]).toBe(true);
    expect(service.id()).toBeNull();
  });

  it('Given the dialog is open, When Cancel is pressed, Then it closes and nothing is saved', async () => {
    const { fixture, service, el } = await render();

    button(el, 'Cancel').click();
    await fixture.whenStable();

    expect(service.id()).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });
});
