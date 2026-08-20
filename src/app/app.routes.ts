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
    path: PATHS.trajets + '/:id',
    loadComponent: () =>
      import('./features/trajets/detail-trajet/detail-trajet').then(m => m.DetailTrajet),
  },
  
  {
    // A2 : route protégée — placeholder jusqu'à A5
    path: PATHS.nouvelleCommande,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/commandes/formulaire-commande/formulaire-commande')
        .then(m => m.FormulaireCommande),
  },

  // B5 — annuaire des transporteurs
  {
    path: PATHS.transporteurs,
    loadChildren: () =>
      import('./features/transporteurs/transporteurs.routes').then(m => m.TRANSPORTEURS_ROUTES),
  },
  { path: '', redirectTo: PATHS.trajets, pathMatch: 'full' },
  { path: '**', redirectTo: PATHS.trajets },  // filet : TOUJOURS en dernier
  
];