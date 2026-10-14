import { Component, ElementRef, inject, input, OnDestroy, AfterViewInit, output } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'cu-dialog',
  host: { style: 'display: contents' },
  template: `
    <div class="backdrop"></div>
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="id + '-title'"
      [attr.aria-describedby]="description() ? id + '-desc' : null"
      (keydown)="onKeydown($event)"
    >
      <div class="dialog__panel">
        <div class="dialog__header">
          <div class="dialog__icon" [class]="'dialog__icon dialog__icon--' + tone()" aria-hidden="true">
            @if (tone() === 'danger') {
              <svg class="icon" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 4.3 2.7 18a1 1 0 0 0 .9 1.5h17a1 1 0 0 0 .9-1.5L13.7 4.3a1 1 0 0 0-1.7 0z" /></svg>
            } @else {
              <svg class="icon" viewBox="0 0 24 24"><path d="M4 12l6 6L20 6" /></svg>
            }
          </div>
          <div style="flex: 1">
            <h2 class="dialog__title" [id]="id + '-title'">{{ title() }}</h2>
            @if (description()) {
              <p [id]="id + '-desc'" class="text-muted" style="margin-top: var(--space-1)">{{ description() }}</p>
            }
          </div>
          <button class="btn btn--ghost btn--icon" type="button" aria-label="Close" (click)="closed.emit()">
            <svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div class="dialog__body stack"><ng-content /></div>
        <div class="dialog__footer"><ng-content select="[footer]" /></div>
      </div>
    </div>
  `,
})
export class Dialog implements AfterViewInit, OnDestroy {
  protected readonly id = `cu-dialog-${nextId++}`;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private opener: HTMLElement | null = null;

  readonly title = input.required<string>();
  readonly description = input('');
  readonly tone = input<'info' | 'danger'>('info');
  readonly closed = output<void>();

  ngAfterViewInit(): void {
    this.opener = document.activeElement as HTMLElement | null;
    this.host.querySelector<HTMLElement>('.dialog__body input, .dialog__body textarea, .dialog__body select')?.focus();
  }

  ngOnDestroy(): void {
    this.opener?.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closed.emit();
    } else if (event.key === 'Tab') {
      const focusable = Array.from(
        this.host.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, a[href]'),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
