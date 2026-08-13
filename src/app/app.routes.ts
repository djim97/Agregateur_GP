import { Routes } from '@angular/router';
import { PATHS } from './app.paths';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: PATHS.login,
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
  },
  {
    path: PATHS.register,
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register),
  },
  {
    // Placeholder A3 : le composant généré affiche "liste-trajets works!"
    path: PATHS.trajets,
    loadComponent: () =>
      import('./features/trajets/liste-trajets/liste-trajets').then(m => m.ListeTrajets),
  },
  {
    // A2 : route protégée — placeholder jusqu'à A5
    path: PATHS.nouvelleCommande,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/commandes/formulaire-commande/formulaire-commande')
        .then(m => m.FormulaireCommande),
  },
  { path: '', redirectTo: PATHS.trajets, pathMatch: 'full' },
  { path: '**', redirectTo: PATHS.trajets },  // filet : TOUJOURS en dernier
];