import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 1. Revisamos si la ruta es PÚBLICA (login o registro)
  // Usamos 'endsWith' por si el API Gateway añade prefijos.
  const isPublicRoute =
    req.url.endsWith('/login') || req.url.endsWith('/usuarios');

  // 2. Si es pública, O si no tenemos token, dejamos pasar la
  //    petición original (sin token).
  if (isPublicRoute || !token) {
    return next(req);
  }

  // 3. Si NO es pública Y SÍ tenemos token, clonamos
  //    la petición y añadimos el header de autorización.
  const clonedReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  // 4. Enviamos la petición CLONADA (con el token)
  return next(clonedReq);
};
