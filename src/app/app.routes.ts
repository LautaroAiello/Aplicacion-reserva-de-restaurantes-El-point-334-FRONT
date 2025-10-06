import { Routes } from '@angular/router';
import { ClienteLayout } from './cliente/layout/cliente/cliente';

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
      },
      {
        path: 'favoritos',
        data: { titulo: 'Favoritos', headerMobileDisponible: true },
        loadComponent: () =>
          import('./cliente/pages/favoritos/favoritos').then(
            (c) => c.ClienteFavoritosPage
          ),
      },
      {
        path: 'perfil',
        data: { titulo: 'Perfil', headerMobileDisponible: true },
        loadComponent: () =>
          import('./cliente/pages/perfil/perfil').then(
            (c) => c.ClientePerfilPage
          ),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
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
