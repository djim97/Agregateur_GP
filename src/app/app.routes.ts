import { Routes } from '@angular/router';
import { PATHS } from './app.paths';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/accueil/accueil').then(m => m.Accueil),
    pathMatch: 'full',
  },
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

  // B2 — suivi de livraison
  {
    path: 'suivi',
    loadChildren: () =>
      import('./features/suivi/suivi.routes').then(m => m.SUIVI_ROUTES),
  },

  // B3 - espace client : mes commandes
  {
    path: PATHS.mesCommandes,
    loadChildren: () =>
      import('./features/espace-client/espace-client.routes').then(m => m.ESPACE_CLIENT_ROUTES),
  },

  //B1- rendez-vous
    {
    path: PATHS.nouveauRdv,
    loadChildren: () =>
      import('./features/rendezvous/rendezvous.routes').then(m => m.RENDEZVOUS_ROUTES),
  },

  //B4- espace transporteur
    {
    path: PATHS.espaceTransporteur,
    loadChildren: () =>
      import('./features/espace-transporteur/espace-transporteur.routes').then(m => m.ESPACE_TRANSPORTEUR_ROUTES),
  },

  { path: '**', redirectTo: PATHS.login, },  // filet : TOUJOURS en dernier
  
];