import { Injectable, signal } from '@angular/core';

export interface ToastOptions {
  kind: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message?: string;
  action?: { label: string; run: () => void };
  /** Closes the toast after this many milliseconds; hovering or focusing it pauses the timer. */
  autoDismissMs?: number;
}

export interface Toast extends ToastOptions {
  id: number;
}

interface Timer {
  handle?: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly timers = new Map<number, Timer>();
  readonly toasts = signal<Toast[]>([]);

  show(options: ToastOptions): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { ...options, id }]);
    if (options.autoDismissMs) {
      this.timers.set(id, { remaining: options.autoDismissMs, startedAt: 0 });
      this.resume(id);
    }
  }

  dismiss(id: number): void {
    this.pause(id);
    this.timers.delete(id);
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  pause(id: number): void {
    const timer = this.timers.get(id);
    if (!timer?.handle) return;
    clearTimeout(timer.handle);
    timer.handle = undefined;
    timer.remaining -= Date.now() - timer.startedAt;
  }

  resume(id: number): void {
    const timer = this.timers.get(id);
    if (!timer || timer.handle) return;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.dismiss(id), timer.remaining);
  }
}
