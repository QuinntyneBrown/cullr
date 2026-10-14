import { TestBed } from '@angular/core/testing';
import { ToastHost } from './toast-host';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('Given a toast is shown, When the host renders, Then it is announced politely and can be dismissed', async () => {
    const fixture = TestBed.createComponent(ToastHost);
    TestBed.inject(ToastService).show({ kind: 'success', title: 'Idea archived' });
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(el.querySelector('.toast.toast--success .toast__title')?.textContent?.trim()).toBe('Idea archived');

    (el.querySelector('button.close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(el.querySelector('.toast')).toBeNull();
  });

  it('Given a toast with text and an action, When the action is used, Then it runs and the toast closes', async () => {
    const fixture = TestBed.createComponent(ToastHost);
    const run = vi.fn();
    TestBed.inject(ToastService).show({ kind: 'info', title: 'Added to Curated', message: '“Porch Light” is best of today.', action: { label: 'View curated', run } });
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.toast__text')?.textContent?.trim()).toBe('“Porch Light” is best of today.');
    (el.querySelector('.toast__action') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(run).toHaveBeenCalled();
    expect(el.querySelector('.toast')).toBeNull();
  });

  it('Given a toast that auto-dismisses, When paused, Then the timer stops until resumed', () => {
    vi.useFakeTimers();
    try {
      const toasts = TestBed.inject(ToastService);
      toasts.show({ kind: 'info', title: 'Added', autoDismissMs: 8000 });
      const id = toasts.toasts()[0].id;

      vi.advanceTimersByTime(5000);
      toasts.pause(id);
      vi.advanceTimersByTime(10000);
      expect(toasts.toasts()).toHaveLength(1);

      toasts.resume(id);
      vi.advanceTimersByTime(3000);
      expect(toasts.toasts()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
