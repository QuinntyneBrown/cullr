import { TestBed } from '@angular/core/testing';
import { IdeaService } from '@cullr/api';
import { ToastService } from '@cullr/components';
import { CaptureIdeaDialog } from './capture-idea-dialog';
import { CaptureIdeaDialogService } from './capture-idea-dialog.service';

describe('CaptureIdeaDialog', () => {
  let capture: ReturnType<typeof vi.fn>;
  let toast: { show: ReturnType<typeof vi.fn> };

  const render = async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: IdeaService, useValue: { capture } },
        { provide: ToastService, useValue: toast },
      ],
    });
    const service = TestBed.inject(CaptureIdeaDialogService);
    service.open();
    const fixture = TestBed.createComponent(CaptureIdeaDialog);
    await fixture.whenStable();
    return { fixture, service, el: fixture.nativeElement as HTMLElement };
  };
  const type = (el: HTMLElement, selector: string, value: string) => {
    const input = el.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const save = async (fixture: { whenStable(): Promise<unknown> }, el: HTMLElement) => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  beforeEach(() => {
    capture = vi.fn();
    toast = { show: vi.fn() };
  });

  it('Given the dialog is opened, When it appears, Then the empty form is shown with focus on Title', async () => {
    const { el } = await render();

    expect(el.querySelector('h2')?.textContent).toBe('Capture an idea');
    expect(document.activeElement?.id).toBe('title');
    expect(el.querySelector('#summary')).not.toBeNull();
    expect(el.querySelector('#category')).not.toBeNull();
    expect(el.querySelector('#score')).not.toBeNull();
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Capture idea');
  });

  it('Given the dialog is closed, When the page renders, Then nothing is shown', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: IdeaService, useValue: { capture } }] });
    const fixture = TestBed.createComponent(CaptureIdeaDialog);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('Given the title is empty and the score is out of range, When saved, Then inline errors and a summary are shown and nothing is sent', async () => {
    const { fixture, el } = await render();
    type(el, '#score', '11');

    await save(fixture, el);

    expect(capture).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Fix 2 errors before capturing this idea');
    expect(el.textContent).toContain('Enter a title for this idea');
    expect(el.textContent).toContain('Enter a whole number from 1 to 10');
  });

  it('Given a valid idea, When saved, Then the dialog closes, a toast confirms and the lists refresh', async () => {
    let resolve!: (value: unknown) => void;
    capture.mockReturnValue(new Promise((r) => (resolve = r)));
    const { fixture, service, el } = await render();
    const version = service.version();
    type(el, '#title', 'Neighbourhood tool library');
    type(el, '#score', '8');

    await save(fixture, el);
    expect(el.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture.mock.calls[0][0]).toMatchObject({ title: 'Neighbourhood tool library', score: '8' });

    resolve({ outcome: 'ok', idea: { id: '1' } });
    await fixture.whenStable();

    expect(service.isOpen()).toBe(false);
    expect(toast.show).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success', title: 'Idea captured' }));
    expect(service.version()).toBe(version + 1);
  });

  it('Given the server rejects the title, When saved, Then the server message is shown on the field', async () => {
    capture.mockResolvedValue({ outcome: 'rejected', errors: { title: 'Enter a title for this idea' } });
    const { fixture, el } = await render();
    type(el, '#title', 'x');

    await save(fixture, el);

    expect(el.textContent).toContain('Enter a title for this idea');
  });

  it('Given the save fails, When retried, Then the entries and capture key are kept and the dialog stays open', async () => {
    capture.mockResolvedValueOnce({ outcome: 'failed' }).mockResolvedValueOnce({ outcome: 'ok', idea: { id: '1' } });
    const { fixture, service, el } = await render();
    type(el, '#title', 'Keep me');

    await save(fixture, el);
    expect(service.isOpen()).toBe(true);
    expect(el.textContent).toContain("Couldn't capture this idea");
    expect((el.querySelector('#title') as HTMLInputElement).value).toBe('Keep me');
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Try again');

    await save(fixture, el);
    expect(capture.mock.calls[1][1]).toBe(capture.mock.calls[0][1]);
    expect(service.isOpen()).toBe(false);
  });

  it('Given text was typed, When Cancel is pressed, Then the dialog closes and nothing is saved', async () => {
    const { fixture, service, el } = await render();
    type(el, '#title', 'Discard me');

    (el.querySelector('[footer] button:not([type="submit"])') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(service.isOpen()).toBe(false);
    expect(capture).not.toHaveBeenCalled();
  });

  it('Given the dialog is open, When Escape is pressed, Then it closes', async () => {
    const { fixture, service, el } = await render();

    el.querySelector('[role="dialog"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(service.isOpen()).toBe(false);
  });
});
