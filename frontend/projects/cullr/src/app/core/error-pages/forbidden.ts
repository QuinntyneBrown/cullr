import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '@cullr/components';
import { ErrorPage } from './error-page';

@Component({
  selector: 'app-forbidden',
  imports: [EmptyState, ErrorPage, RouterLink],
  template: `
    <app-error-page>
      <cu-empty-state title="You can't access this page">
        <svg icon class="icon icon--lg" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        This area isn't available for your account. Go back to Today.
        <ng-container ngProjectAs="[actions]">
          <a class="btn btn--primary" routerLink="/">Back to Today</a>
          <button type="button" class="btn" (click)="location.back()">Go back</button>
        </ng-container>
      </cu-empty-state>
    </app-error-page>
  `,
})
export class Forbidden {
  protected readonly location = inject(Location);
}
