import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';
import { Notifications } from '../services/notifications';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const notifications = inject(Notifications);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const estRouteAuth = req.url.endsWith('/login') || req.url.endsWith('/register');

      if (err.status === 0) {
        notifications.erreur("API injoignable : vérifiez que 'npm run api' est lancé.");
      } else if (err.status === 401 && !estRouteAuth) {
        notifications.erreur('Session expirée, veuillez vous reconnecter.');
        auth.logout();
      } else if (err.status === 403) {
        notifications.erreur('Accès refusé.');
      }
      // 400 (login raté), 404 (introuvable), etc. : les composants gèrent localement

      return throwError(() => err); // toujours re-propager : les composants gardent leur logique
    })
  );
};