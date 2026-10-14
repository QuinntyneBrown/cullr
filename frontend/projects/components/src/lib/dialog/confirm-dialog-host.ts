import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { DialogService } from './dialog.service';

@Component({
  selector: 'cu-confirm-dialog-host',
  template: `
    @if (service.current(); as dialog) {
      <div class="dialog">
        <div
          #panel
          class="dialog__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cu-dialog-title"
          tabindex="-1"
          (keydown)="onKeydown($event)"
        >
          <div class="dialog__header">
            <h2 class="dialog__title" id="cu-dialog-title">{{ dialog.title }}</h2>
          </div>
          <div class="dialog__body">
            <p>{{ dialog.body }}</p>
          </div>
          <div class="dialog__footer">
            <button class="btn" type="button" (click)="service.close(false)">Cancel</button>
            <button class="btn btn--danger" type="button" (click)="service.close(true)">
              {{ dialog.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogHost {
  protected readonly service = inject(DialogService);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const panel = this.panel()?.nativeElement;
      if (panel) {
        this.opener = document.activeElement as HTMLElement | null;
        panel.querySelector<HTMLElement>('button')?.focus();
      } else {
        this.opener?.focus();
        this.opener = null;
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.service.close(false);
    } else if (event.key === 'Tab') {
      const buttons = Array.from(
        (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button'),
      );
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}
