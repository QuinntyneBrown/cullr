import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CaptureIdeaDialogService {
  readonly isOpen = signal(false);
  /** Bumped after each capture so Today and Ideas reload. */
  readonly version = signal(0);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  captured(): void {
    this.version.update((v) => v + 1);
    this.close();
  }
}
