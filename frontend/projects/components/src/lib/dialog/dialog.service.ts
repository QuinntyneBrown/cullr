import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  body: string;
  confirmLabel: string;
}

export interface OpenConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly current = signal<OpenConfirm | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.current.set({ ...options, resolve });
    });
  }

  close(confirmed: boolean): void {
    this.current()?.resolve(confirmed);
    this.current.set(null);
  }
}
