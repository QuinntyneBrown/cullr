import { Routes } from '@angular/router';
import { Forbidden } from './core/error-pages/forbidden';
import { NotFound } from './core/error-pages/not-found';
import { Offline } from './core/error-pages/offline';
import { ServerError } from './core/error-pages/server-error';
import { AuthenticatedShell } from './core/shell/authenticated-shell';

export const routes: Routes = [
  { path: '', component: AuthenticatedShell, children: [] },
  { path: '403', component: Forbidden },
  { path: '404', component: NotFound },
  { path: '500', component: ServerError },
  { path: 'offline', component: Offline },
  { path: '**', component: NotFound },
];
