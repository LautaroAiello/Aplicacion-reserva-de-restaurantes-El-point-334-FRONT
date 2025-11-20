import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  template: `
    <div class="admin-container">
      <h1>Panel de Administrador</h1>
      <p>Bienvenido. Desde aquí puedes gestionar tu restaurante.</p>

      @if (adminRestauranteId()) {
      <div class="dashboard-actions">
        <mat-card>
          <mat-card-header
            ><mat-card-title>Configuración</mat-card-title></mat-card-header
          >
          <mat-card-content
            ><p>
              Editar datos generales, dirección y horarios.
            </p></mat-card-content
          >
          <mat-card-actions>
            <a mat-flat-button color="primary" routerLink="/admin/configuracion"
              >Ir a Configuración</a
            >
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header
            ><mat-card-title>Mesas y Salón</mat-card-title></mat-card-header
          >
          <mat-card-content
            ><p>Crear, editar y bloquear mesas del salón.</p></mat-card-content
          >
          <mat-card-actions>
            <a mat-flat-button color="primary" routerLink="/admin/mesas"
              >Gestionar Mesas</a
            >
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header
            ><mat-card-title>Menú y Platos</mat-card-title></mat-card-header
          >
          <mat-card-content
            ><p>Administrar platos, precios y categorías.</p></mat-card-content
          >
          <mat-card-actions>
            <a mat-flat-button color="primary" routerLink="/admin/menu"
              >Gestionar Menú</a
            >
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header
            ><mat-card-title>Equipo</mat-card-title></mat-card-header
          >
          <mat-card-content
            ><p>
              Crear cuentas para tus empleados (Gestores).
            </p></mat-card-content
          >
          <mat-card-actions>
            <a
              mat-flat-button
              color="primary"
              [routerLink]="['/admin/asignar-gestor', adminRestauranteId()]"
              >Asignar Gestor</a
            >
          </mat-card-actions>
        </mat-card>
      </div>
      } @else {
      <p>No tienes un restaurante asignado.</p>
      }
    </div>
  `,
  styles: `
    .admin-container { padding: 24px; }
    .dashboard-actions { display: flex; gap: 20px; flex-wrap: wrap; }
    mat-card { min-width: 300px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage implements OnInit {
  private authService = inject(AuthService);
  protected adminRestauranteId = signal<string | null>(null);

  ngOnInit() {
    // Leemos los roles del Admin desde el servicio
    const rolesRestaurante = this.authService.getRestauranteRoles();

    // Buscamos el primer restaurante donde sea ADMIN
    // (Asumimos que un ADMIN solo administra un restaurante principal)
    const miRestaurante = rolesRestaurante.find(
      (r) => r.rol === 'ADMIN' || r.rol === 'GESTOR'
    ); // O solo 'ADMIN'

    if (miRestaurante) {
      this.adminRestauranteId.set(miRestaurante.restauranteId.toString());
    }
  }
}
