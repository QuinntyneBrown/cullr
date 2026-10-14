import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    tap({
      error: (error: unknown) => {
        if (!(error instanceof HttpErrorResponse)) return;
        if (error.status === 403) {
          router.navigate(['/403']);
        } else if (error.status >= 500) {
          const ref = (error.error as { referenceId?: string } | null)?.referenceId;
          router.navigate(['/500'], ref ? { queryParams: { ref } } : undefined);
        }
      },
    }),
  );
};
