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
  if (authService.hasRole('ADMIN')) {
    return true; // <-- ¡Sí! Puede pasar.
  }

  // 3. Está logueado, pero NO es ADMIN
  console.error('AdminGuard: Acceso denegado. No tiene rol ADMIN.');
  // Lo mandamos al login de admin (o podrías mandarlo al home de cliente)
  router.navigate(['/admin/login']);
  return false;
};
