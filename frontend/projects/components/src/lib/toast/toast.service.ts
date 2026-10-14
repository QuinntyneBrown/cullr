import { Injectable, signal } from '@angular/core';

export interface ToastOptions {
  kind: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message?: string;
}

export interface Toast extends ToastOptions {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  show(options: ToastOptions): void {
    this.toasts.update((list) => [...list, { ...options, id: this.nextId++ }]);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
