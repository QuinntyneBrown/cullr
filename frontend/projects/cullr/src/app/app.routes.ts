import { Routes } from '@angular/router';
import { NotFound } from './core/error-pages/not-found';
import { AuthenticatedShell } from './core/shell/authenticated-shell';

export const routes: Routes = [
  { path: '', component: AuthenticatedShell, children: [] },
  { path: '**', component: NotFound },
];
