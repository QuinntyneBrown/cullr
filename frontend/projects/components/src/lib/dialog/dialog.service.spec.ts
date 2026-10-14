import { TestBed } from '@angular/core/testing';
import { ConfirmDialogHost } from './confirm-dialog-host';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
  async function open() {
    const fixture = TestBed.createComponent(ConfirmDialogHost);
    const result = TestBed.inject(DialogService).confirm({
      title: 'Archive this idea?',
      body: 'You can restore it from Archive.',
      confirmLabel: 'Archive idea',
    });
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, fixture, result };
  }

  it('Given a confirmation is requested, When the owner confirms, Then it resolves true and closes', async () => {
    const { el, fixture, result } = await open();

    const panel = el.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(el.querySelector('.dialog__title')?.textContent?.trim()).toBe('Archive this idea?');

    (el.querySelector('button.btn--danger') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(await result).toBe(true);
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('Given a confirmation is open, When the owner presses Escape, Then it resolves false and closes', async () => {
    const { el, fixture, result } = await open();

    el.querySelector('[role="dialog"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await fixture.whenStable();

    expect(await result).toBe(false);
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });
});
