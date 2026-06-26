import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.temSessaoExpirada()) {
    authService.logoutPorExpiracao();
    return false;
  }

  if (authService.isAuthenticated() && authService.currentUser()?.role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/app']);
};
