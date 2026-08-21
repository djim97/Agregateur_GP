import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';

export const ESPACE_CLIENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./mes-commandes/mes-commandes').then(m => m.MesCommandes),
  },
  {
    path: 'reclamations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./reclamations/reclamations').then(m => m.ReclamationsPage),
  },
];
