import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@cullr/api';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const returnUrl = state.url === '/' ? undefined : state.url;
  const signIn = inject(Router).createUrlTree(['/sign-in'], returnUrl ? { queryParams: { returnUrl } } : {});
  return auth.isSignedIn().then((signedIn) => signedIn || signIn);
};
