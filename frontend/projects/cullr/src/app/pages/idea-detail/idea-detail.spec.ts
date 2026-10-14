import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { IdeaDetail, IdeaService } from '@cullr/api';
import { DialogService, ToastService } from '@cullr/components';
import { CurateIdeaDialogService } from '../../core/curate/curate-idea-dialog.service';
import { EditIdeaDialogService } from '../../core/edit/edit-idea-dialog.service';
import { IdeaDetailPage } from './idea-detail';

const detail = (over: Partial<IdeaDetail> = {}): IdeaDetail => ({
  id: 'a1', title: 'Porch Light', summary: 'A same-day favour board.', category: 'Toronto & GTA', score: 9, status: 'Building',
  loggedAt: 1000, strengths: 'Real need', risks: 'Trust and liability', nextStep: 'Sketch the flow', version: 2, archived: false,
  history: [
    { description: 'Building', at: Date.now() },
    { description: 'Logged', at: Date.parse('2025-03-02T15:00:00Z') },
  ],
  ...over,
});

describe('IdeaDetailPage', () => {
  let get: ReturnType<typeof vi.fn>;
  let setStatus: ReturnType<typeof vi.fn>;
  let confirm: ReturnType<typeof vi.fn>;
  let toast: { show: ReturnType<typeof vi.fn> };

  const render = async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'a1' }) } } },
        { provide: IdeaService, useValue: { get, setStatus } },
        { provide: DialogService, useValue: { confirm } },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(IdeaDetailPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };
  const button = (el: HTMLElement, text: string) =>
    Array.from(el.querySelectorAll('button, a.btn')).find((b) => b.textContent?.trim() === text) as HTMLElement | undefined;

  beforeEach(() => {
    get = vi.fn().mockResolvedValue(detail());
    setStatus = vi.fn();
    confirm = vi.fn().mockResolvedValue(true);
    toast = { show: vi.fn() };
  });

  it('Given an idea, When the page opens, Then it shows the title, badges, summary, critique notes and history newest first (L2-012)', async () => {
    const { el } = await render();

    expect(get).toHaveBeenCalledWith('a1');
    expect(el.querySelector('h1')?.textContent).toBe('Porch Light');
    expect(el.querySelector('.breadcrumb li[aria-current="page"]')?.textContent).toBe('Porch Light');
    expect(el.querySelector('.subtitle')?.textContent).toContain('Toronto & GTA');
    expect(el.querySelector('.subtitle')?.textContent).toContain('Building');
    expect(el.textContent).toContain('A same-day favour board.');
    expect(Array.from(el.querySelectorAll('dl.dl dt')).map((e) => e.textContent)).toEqual(['Strengths', 'Risks', 'Next step']);
    expect(Array.from(el.querySelectorAll('dl.dl dd')).map((e) => e.textContent)).toEqual(['Real need', 'Trust and liability', 'Sketch the flow']);
    const history = Array.from(el.querySelectorAll('.list__item'));
    expect(history.map((h) => h.querySelector('.list__title')?.textContent)).toEqual(['Building', 'Logged']);
    expect(history[0].querySelector('.list__meta')?.textContent).toContain('Today,');
    expect(history[1].querySelector('.list__meta')?.textContent).toContain('Mar 2');
  });

  it('Given empty critique notes, When shown, Then each field reads as not yet written', async () => {
    get.mockResolvedValue(detail({ strengths: '', risks: '', nextStep: '' }));
    const { el } = await render();

    expect(el.querySelector('dl.dl dd')?.textContent).toBe('Not written yet');
  });

  it('Given an active idea, When shown, Then Curate, Archive and Edit idea are offered', async () => {
    const { el } = await render();

    expect(button(el, 'Curate')).toBeDefined();
    expect(button(el, 'Archive')).toBeDefined();
    expect(button(el, 'Edit idea')).toBeDefined();
  });

  it('Given an active idea, When Curate is pressed, Then the curate dialog opens for it', async () => {
    const { el } = await render();

    button(el, 'Curate')!.click();

    expect(TestBed.inject(CurateIdeaDialogService).ids()).toEqual(['a1']);
  });

  it('Given the idea is curated, When the dialog reports it, Then the idea reloads', async () => {
    const { fixture } = await render();

    TestBed.inject(CurateIdeaDialogService).saved();
    await fixture.whenStable();

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('Given the idea is loading, When the page opens, Then a skeleton is shown', async () => {
    get.mockReturnValue(new Promise(() => {}));
    const { el } = await render();

    expect(el.querySelector('[aria-busy="true"] .skeleton')).not.toBeNull();
  });

  it('Given the load fails, When shown, Then an error with Try again and Back to Ideas is offered and retrying reloads', async () => {
    get.mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(detail());
    const { fixture, el } = await render();

    expect(el.querySelector('.empty__title')?.textContent?.trim()).toBe("This idea couldn't load");
    expect(Array.from(el.querySelectorAll('a[href="/ideas"]')).map((a) => a.textContent?.trim())).toContain('Back to Ideas');
    button(el, 'Try again')!.click();
    await fixture.whenStable();

    expect(el.querySelector('h1')?.textContent).toBe('Porch Light');
  });

  it('Given an unknown id, When the server answers 404, Then the Page not found screen is shown', async () => {
    get.mockRejectedValue({ status: 404 });
    const { fixture } = await render();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/404');
  });

  it('Given an archived idea, When shown, Then it is read-only with Restore and Delete permanently and no Edit', async () => {
    get.mockResolvedValue(detail({ archived: true }));
    const { el } = await render();

    expect(el.querySelector('.alert--warning .alert__title')?.textContent).toContain('Archived');
    expect(el.textContent).toContain('Editing is turned off for archived ideas');
    expect(button(el, 'Restore')).toBeDefined();
    expect(button(el, 'Delete permanently')).toBeDefined();
    expect(button(el, 'Edit idea')).toBeUndefined();
    expect(button(el, 'Mark as Building')).toBeUndefined();
  });

  it('Given an active idea, When Edit idea is pressed, Then the Edit dialog opens, and the page reloads after a save', async () => {
    const { fixture, el } = await render();

    button(el, 'Edit idea')!.click();
    expect(TestBed.inject(EditIdeaDialogService).id()).toBe('a1');
    TestBed.inject(EditIdeaDialogService).saved();
    await fixture.whenStable();

    expect(get).toHaveBeenCalledTimes(2);
  });

  describe('status control (L2-052)', () => {
    it('Given an active idea, When the control is shown, Then it offers exactly Building and Built', async () => {
      const { el } = await render();

      const options = Array.from(el.querySelectorAll('.status-control button')).map((b) => b.textContent?.trim());
      expect(options).toEqual(['Mark as Building', 'Mark as Built']);
    });

    it('Given a choice, When confirmed, Then the status is set, the page shows it and a toast confirms', async () => {
      setStatus.mockResolvedValue({ outcome: 'ok', idea: detail({ status: 'Built' }) });
      const { fixture, el } = await render();

      button(el, 'Mark as Built')!.click();
      await fixture.whenStable();

      expect(confirm).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('a1', 'Built');
      expect(el.querySelector('.subtitle')?.textContent).toContain('Built');
      expect(toast.show).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
    });

    it('Given a choice, When the confirmation is cancelled, Then nothing is sent', async () => {
      confirm.mockResolvedValue(false);
      const { fixture, el } = await render();

      button(el, 'Mark as Built')!.click();
      await fixture.whenStable();

      expect(setStatus).not.toHaveBeenCalled();
    });

    it('Given the idea already has the status, When it is chosen, Then nothing is sent', async () => {
      const { fixture, el } = await render();

      button(el, 'Mark as Building')!.click();
      await fixture.whenStable();

      expect(confirm).not.toHaveBeenCalled();
      expect(setStatus).not.toHaveBeenCalled();
    });

    it('Given the save fails, When confirmed, Then the previous status stays and a failure with retry is shown', async () => {
      setStatus.mockResolvedValueOnce({ outcome: 'failed' }).mockResolvedValueOnce({ outcome: 'ok', idea: detail({ status: 'Built' }) });
      const { fixture, el } = await render();

      button(el, 'Mark as Built')!.click();
      await fixture.whenStable();
      expect(el.querySelector('.subtitle')?.textContent).toContain('Building');
      expect(el.textContent).toContain("Couldn't update the status");

      button(el, 'Try again')!.click();
      await fixture.whenStable();
      expect(setStatus).toHaveBeenCalledTimes(2);
      expect(el.querySelector('.subtitle')?.textContent).toContain('Built');
      expect(el.textContent).not.toContain("Couldn't update the status");
    });
  });
});
