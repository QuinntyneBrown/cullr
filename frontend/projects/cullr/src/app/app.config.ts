import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { unauthorizedInterceptor } from './core/auth/unauthorized.interceptor';
import { apiErrorInterceptor } from './core/error-pages/api-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([apiErrorInterceptor, unauthorizedInterceptor])),
    provideRouter(routes)
  ]
};
