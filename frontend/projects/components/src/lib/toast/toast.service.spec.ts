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
});
