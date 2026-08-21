import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';
import { roleGuard } from '../../core/guards/role-guard';

export const ESPACE_TRANSPORTEUR_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { role: 'transporteur' },
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'trajets',
        loadComponent: () => import('./mes-trajets/mes-trajets').then(m => m.MesTrajets),
      },
      {
        path: 'commandes',
        loadComponent: () => import('./commandes-recues/commandes-recues').then(m => m.CommandesRecues),
      },
      {
        path: 'produits-illicites',
        loadComponent: () => import('./produits-illicites/produits-illicites').then(m => m.ProduitsIllicites),
      },
      {
        path: 'avis-reclamations',
        loadComponent: () => import('./avis-reclamations/avis-reclamations').then(m => m.AvisReclamations),
      },
      {
        path: 'livraisons/:id',
        loadComponent: () => import('./maj-livraison/maj-livraison').then(m => m.MajLivraison),
      },
    ],
  },
];
