import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EditIdeaDialogService {
  /** Id of the idea being edited; null while the dialog is closed. */
  readonly id = signal<string | null>(null);
  /** Bumped after each save so pages showing the idea reload. */
  readonly version = signal(0);

  open(id: string): void {
    this.id.set(id);
  }

  close(): void {
    this.id.set(null);
  }

  saved(): void {
    this.version.update((v) => v + 1);
    this.close();
  }
}
