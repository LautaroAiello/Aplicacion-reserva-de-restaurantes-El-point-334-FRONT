import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usamos el signal 'isAuthenticated' de tu servicio
  if (authService.isAuthenticated()) {
    return true; // <-- El usuario está logueado, puede pasar.
  }

  // Si no está logueado:
  // 1. Redirigimos a la página de login
  // 2. Retornamos 'false' para bloquear la navegación
  console.warn(
    'Acceso denegado - Usuario no autenticado. Redirigiendo a /login...'
  );
  router.navigate(['/login']); // <-- Ajusta a '/cliente/login' si esa es tu ruta
  return false;
};
