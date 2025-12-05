import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. ¿Está logueado?
  if (!authService.isAuthenticated()) {
    console.warn('AdminGuard: No autenticado. Redirigiendo a /admin/login');
    router.navigate(['/admin/login']);
    return false;
  }

  // 2. ¿Es ADMIN?
  if (authService.hasRole('ADMIN') || authService.isGestor()) {
    return true;
  }

  // Lo mandamos al login de admin (o podrías mandarlo al home de cliente)
  router.navigate(['/login']);
  return false;
};
