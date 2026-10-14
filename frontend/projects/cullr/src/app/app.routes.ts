import { Routes } from '@angular/router';
import { Forbidden } from './core/error-pages/forbidden';
import { NotFound } from './core/error-pages/not-found';
import { Offline } from './core/error-pages/offline';
import { ServerError } from './core/error-pages/server-error';
import { authGuard } from './core/auth/auth.guard';
import { AuthShell } from './core/shell/auth-shell';
import { AuthenticatedShell } from './core/shell/authenticated-shell';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password';
import { ResetPasswordPage } from './pages/reset-password/reset-password';
import { SignInPage } from './pages/sign-in/sign-in';
import { TodayPage } from './pages/today/today';
import { IdeasPage } from './pages/ideas/ideas';
import { IdeaDetailPage } from './pages/idea-detail/idea-detail';
import { CuratedPage } from './pages/curated/curated';

export const routes: Routes = [
  {
    path: '',
    component: AuthenticatedShell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', component: TodayPage },
      { path: 'today', component: TodayPage },
      { path: 'ideas', component: IdeasPage },
      { path: 'ideas/:id', component: IdeaDetailPage },
      { path: 'curated', component: CuratedPage },
    ],
  },
  {
    path: '',
    component: AuthShell,
    children: [
      { path: 'sign-in', component: SignInPage },
      { path: 'forgot-password', component: ForgotPasswordPage },
      { path: 'reset-password', component: ResetPasswordPage },
    ],
  },
  { path: '403', component: Forbidden },
  { path: '404', component: NotFound },
  { path: '500', component: ServerError },
  { path: 'offline', component: Offline },
  { path: '**', component: NotFound },
];
