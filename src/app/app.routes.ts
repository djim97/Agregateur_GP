import { Routes } from '@angular/router';
import { PATHS } from './app.paths';

export const routes: Routes = [
  {
    path: PATHS.login,
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
  },
  {
    // Placeholder A3 : le composant généré affiche "liste-trajets works!"
    path: PATHS.trajets,
    loadComponent: () =>
      import('./features/trajets/liste-trajets/liste-trajets').then(m => m.ListeTrajets),
  },
  { path: '', redirectTo: PATHS.trajets, pathMatch: 'full' },
  { path: '**', redirectTo: PATHS.trajets },  // filet : TOUJOURS en dernier
];