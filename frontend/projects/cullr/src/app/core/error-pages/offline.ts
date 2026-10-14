import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '@cullr/components';
import { ErrorPage } from './error-page';

@Component({
  selector: 'app-offline',
  imports: [EmptyState, ErrorPage, RouterLink],
  template: `
    <app-error-page>
      <cu-empty-state title="You're offline">
        <svg icon class="icon icon--lg" viewBox="0 0 24 24"><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 3-2M19 12.5a10 10 0 0 0-3.4-2.3M12 20h.01" /></svg>
        Cullr can't reach the network. You can still read ideas you've already loaded; new changes will sync once you're back online.
        <ng-container ngProjectAs="[actions]">
          <button type="button" class="btn btn--primary" (click)="location.back()">Try again</button>
          <a class="btn" routerLink="/">Back to Today</a>
        </ng-container>
      </cu-empty-state>
    </app-error-page>
  `,
})
export class Offline {
  protected readonly location = inject(Location);
}
