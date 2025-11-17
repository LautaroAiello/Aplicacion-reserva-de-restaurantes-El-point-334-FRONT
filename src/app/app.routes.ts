import { Routes } from '@angular/router';
import { ClienteLayout } from './cliente/layout/cliente/cliente';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    component: ClienteLayout,
    children: [
      {
        path: 'home',
        data: { titulo: 'Bievenido', headerMobileDisponible: true },
        loadComponent: () =>
          import('./cliente/pages/home/home').then((c) => c.ClienteHomePage),
        canActivate: [authGuard],
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
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () =>
      import('./administrador/admin.routes').then((r) => r.adminRoutes),
  },
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
  {
    path: '**',
    redirectTo: '',
  },
];
