import { Routes } from '@angular/router';
import { PATHS } from './app.paths';

export const routes: Routes = [{ path: PATHS.login, loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  { path: '', redirectTo: PATHS.trajets, pathMatch: 'full' },];
