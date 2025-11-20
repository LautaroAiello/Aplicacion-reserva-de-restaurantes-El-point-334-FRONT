import { Routes } from '@angular/router';
import { ClienteLayout } from './cliente/layout/cliente/cliente';
import { authGuard } from './core/guards/auth-guard'; // Asegúrate de que el nombre del archivo coincida
import { adminGuard } from './core/guards/admin-guard'; // Asegúrate de que el nombre del archivo coincida

export const routes: Routes = [
  // =========================================================
  // 1. RUTAS PÚBLICAS DE ADMINISTRADOR (¡Deben ir PRIMERO!)
  // =========================================================
  // Al estar arriba, Angular entra aquí sin activar el adminGuard
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./administrador/pages/login/login').then(
        (c) => c.AdministradorLoginPage
      ),
  },
  {
    path: 'admin/register',
    loadComponent: () =>
      import('./administrador/pages/register/register').then(
        (c) => c.AdministradorRegisterPage
      ),
  },

  // =========================================================
  // 2. RUTA PROTEGIDA DE ADMINISTRADOR (Dashboard y Gestión)
  // =========================================================
  // Captura todo lo demás que empiece con 'admin/...'
  {
    path: 'admin',
    canActivate: [adminGuard], // El guardia protege todo lo que esté aquí dentro
    loadChildren: () =>
      import('./administrador/admin.routes').then((r) => r.adminRoutes),
  },

  // =========================================================
  // 3. RUTAS PÚBLICAS DE CLIENTE (Login/Registro)
  // =========================================================
  {
    path: 'login',
    loadComponent: () =>
      import('./cliente/pages/login/login').then((c) => c.ClienteLoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./cliente/pages/register/register').then(
        (c) => c.ClienteRegisterPage
      ),
  },

  // =========================================================
  // 4. LAYOUT PRINCIPAL DE CLIENTE (Home, Reservas, etc.)
  // =========================================================
  {
    path: '',
    component: ClienteLayout,
    children: [
      {
        path: 'home',
        data: { titulo: 'Bienvenido', headerMobileDisponible: true },
        loadComponent: () =>
          import('./cliente/pages/home/home').then((c) => c.ClienteHomePage),
        canActivate: [authGuard], // Protegemos el home si es necesario
      },
      {
        path: 'restaurantes',
        data: { titulo: 'Restaurantes', headerMobileDisponible: true },
        loadComponent: () =>
          import('./cliente/pages/restaurantes/restaurantes').then(
            (c) => c.ClienteRestaurantesPage
          ),
      },
      {
        path: 'restaurante/:id',
        data: { titulo: null, headerMobileDisponible: false },
        loadComponent: () =>
          import('./cliente/pages/restaurante/restaurante').then(
            (c) => c.ClienteRestaurantePage
          ),
      },
      {
        path: 'reservas',
        data: { titulo: 'Reservas', headerMobileDisponible: true },
        loadComponent: () =>
          import('./cliente/pages/reservas/reservas').then(
            (c) => c.ClienteReservasPage
          ),
        canActivate: [authGuard],
      },
      {
        path: 'favoritos',
        data: { titulo: 'Favoritos', headerMobileDisponible: true },
        loadComponent: () =>
          import('./cliente/pages/favoritos/favoritos').then(
            (c) => c.ClienteFavoritosPage
          ),
        canActivate: [authGuard],
      },
      {
        path: 'perfil',
        data: { titulo: 'Perfil', headerMobileDisponible: true },
        loadComponent: () =>
          import('./cliente/pages/perfil/perfil').then(
            (c) => c.ClientePerfilPage
          ),
        canActivate: [authGuard],
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  // =========================================================
  // 5. COMODÍN (404)
  // =========================================================
  {
    path: '**',
    redirectTo: '', // O a un componente NotFoundPage
  },
];
