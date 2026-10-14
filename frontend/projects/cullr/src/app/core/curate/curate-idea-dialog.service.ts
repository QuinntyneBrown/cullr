import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurateIdeaDialogService {
  /** Ids of the ideas being curated; null while the dialog is closed. */
  readonly ids = signal<string[] | null>(null);
  /** Bumped after each save so pages showing the ideas reload. */
  readonly version = signal(0);

  open(ids: string[]): void {
    this.ids.set(ids);
  }

  close(): void {
    this.ids.set(null);
  }

  saved(): void {
    this.version.update((v) => v + 1);
    this.close();
  }
}
