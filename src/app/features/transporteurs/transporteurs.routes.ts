import { Routes } from '@angular/router';

export const TRANSPORTEURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./annuaire/annuaire').then(m => m.Annuaire),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./profil-transporteur/profil-transporteur').then(m => m.ProfilTransporteur),
  },
];