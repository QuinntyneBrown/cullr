import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyState } from '@cullr/components';
import { ErrorPage } from './error-page';

@Component({
  selector: 'app-server-error',
  imports: [EmptyState, ErrorPage, RouterLink],
  template: `
    <app-error-page>
      <cu-empty-state title="Something went wrong">
        <svg icon class="icon icon--lg" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 4.3 2.7 18a1 1 0 0 0 .9 1.5h17a1 1 0 0 0 .9-1.5L13.7 4.3a1 1 0 0 0-1.7 0z" /></svg>
        An unexpected error happened on our end. Try again, and if it keeps happening, come back later.
        @if (referenceId) {
          <br />Reference: {{ referenceId }}
        }
        <ng-container ngProjectAs="[actions]">
          <button type="button" class="btn btn--primary" (click)="location.back()">Try again</button>
          <a class="btn" routerLink="/">Back to Today</a>
        </ng-container>
      </cu-empty-state>
    </app-error-page>
  `,
})
export class ServerError {
  protected readonly location = inject(Location);
  protected readonly referenceId = inject(ActivatedRoute).snapshot.queryParamMap.get('ref');
}
