import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { PATHS } from '../../app.paths';
import { Role } from '../../models/user.model';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const requiredRole = route.data['role'] as Role | undefined;

  if (requiredRole && auth.role() === requiredRole) {
    return true;
  }

  return router.createUrlTree(['/' + PATHS.trajets]);
};