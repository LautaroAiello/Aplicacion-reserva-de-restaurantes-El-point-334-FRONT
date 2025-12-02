import { Routes } from '@angular/router';

// (Opcional) Podríamos crear un AdminLayoutComponent
// pero por ahora usemos componentes directos.

export const adminRoutes: Routes = [
  {
    path: '', // Ruta raíz de /admin
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then(
        (c) => c.AdminDashboardPage
      ),
  },
  {
    path: 'configuracion', // <-- NUEVA RUTA
    loadComponent: () =>
      import('./pages/configuracion/configuracion.page').then(
        (c) => c.ConfiguracionPage
      ),
  },
  {
    path: 'mesas', // <-- NUEVA RUTA
    loadComponent: () =>
      import('./pages/gestion-mesas/gestion-mesas.page').then(
        (c) => c.GestionMesasPage
      ),
  },
  {
    path: 'menu', // <-- NUEVA RUTA
    loadComponent: () =>
      import('./pages/gestion-menu/gestion-menu.page').then(
        (c) => c.GestionMenuPage
      ),
  },
  {
    path: 'asignar-gestor/:restauranteId', // Ruta para la SAGA 2
    loadComponent: () =>
      import('./pages/asignar-gestor/asignar-gestor.page').then(
        (c) => c.AsignarGestorPage
      ),
    // (Opcional) Aquí iría un Guard para verificar que el ADMIN
    // sea dueño de este :restauranteId específico.
  },
  {
    path: 'reservas/nueva', 
    loadComponent: () => import('./pages/nueva-reserva/nueva-reserva').then(c => c.AdminNuevaReservaPage),
  },
  {
    path: '**',
    redirectTo: '', // Redirige /admin/loquesea a /admin
  },
];
