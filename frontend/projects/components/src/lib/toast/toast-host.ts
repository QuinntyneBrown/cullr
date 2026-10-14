import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'cu-toast-host',
  template: `
    <div class="toast-region" aria-live="polite">
      @for (toast of service.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.kind">
          <div class="toast__body">
            <div class="toast__title">{{ toast.title }}</div>
            @if (toast.message) {
              <div>{{ toast.message }}</div>
            }
          </div>
          <button class="close" type="button" aria-label="Dismiss" (click)="service.dismiss(toast.id)">
            <svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly service = inject(ToastService);
}
