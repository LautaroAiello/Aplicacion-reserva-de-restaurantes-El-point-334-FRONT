import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReservasService } from '../../../core/services/reservas.service';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AlertService } from '../../../core/services/alert.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReservaAdminDTO } from '../../../core/models/reserva.model';
import { MesaDTO } from '../../../core/models/mesa.model';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, 
    MatIconModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule,
    DatePipe
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage implements OnInit {
  private authService = inject(AuthService);
  private reservasService = inject(ReservasService);
  private restauranteService = inject(RestauranteService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private alertService = inject(AlertService);

  // Estados
  protected cargando = signal<boolean>(true);
  protected esAdmin = signal<boolean>(false); 
  protected restauranteId!: string;

  // Datos
  protected listaReservas = signal<ReservaAdminDTO[]>([]);
  protected listaMesas = signal<MesaDTO[]>([]);

  // --- WIDGETS COMPUTADOS ---
  protected cantConfirmadas = computed(() => 
    this.listaReservas().filter(r => r.estado === 'CONFIRMADA').length
  );
  protected cantPendientes = computed(() => 
    this.listaReservas().filter(r => r.estado === 'PENDIENTE').length
  );
  
  protected cantMesasLibres = computed(() => 
    this.listaMesas().filter(m => !m.bloqueada).length
  );
  protected cantMesasOcupadas = computed(() => 
    this.listaMesas().filter(m => m.bloqueada).length 
  );

  // Tabla
  protected displayedColumns: string[] = ['cliente', 'fecha', 'hora', 'mesa', 'personas', 'acciones'];

  ngOnInit() {
    // 1. Verificar Roles (Admin ve todo, Gestor ve limitado)
    this.esAdmin.set(this.authService.hasRole('ADMIN'));
    
    // 2. Obtener Restaurante ID
    const roles = this.authService.getRestauranteRoles();
    const miRestaurante = roles.find(r => r.rol === 'ADMIN' || r.rol === 'GESTOR');

    if (miRestaurante) {
      this.restauranteId = miRestaurante.restauranteId.toString();
      this.cargarDatos();
    } else {
      this.cargando.set(false);
    }
  }

  cargarDatos() {
    this.cargando.set(true);
    
    // Cargar Mesas
    this.restauranteService.getListarMesas(this.restauranteId).subscribe(mesas => {
      this.listaMesas.set(mesas);
    });

    // Cargar Reservas
    this.cargarReservas();
  }

  cargarReservas() {
    this.reservasService.getReservasPorRestaurante(this.restauranteId).subscribe({
      next: (reservas) => {
        // Ordenar por fecha más reciente (para ver las nuevas arriba)
        const ordenadas = reservas.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
        this.listaReservas.set(ordenadas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  // --- LÓGICA DE VISUALIZACIÓN INTELIGENTE (CLIENTE MANUAL VS APP) ---

  // Detecta si es manual mirando las observaciones
  esReservaManual(row: ReservaAdminDTO): boolean {
    return row.tipo === 'MANUAL' || row.apellidoCliente === '(Manual)';
  }
  

  // --- ACCIONES ---

  gestionarReserva(reserva: ReservaAdminDTO, nuevoEstado: string) {
    this.cargando.set(true);
    // Llamada al servicio (asumiendo que usa actualizarEstadoReserva o un PUT similar)
    this.reservasService.actualizarEstadoReserva(reserva.id, nuevoEstado).subscribe({
      next: () => {
        // Mensaje más amigable según la acción
        const accion = nuevoEstado === 'CONFIRMADA' ? 'confirmada' : 'rechazada';
        this.alertService.success('Éxito', `Reserva ${accion} correctamente.`);
        
        this.cargarReservas(); // Recargar lista para reflejar cambios
      },
      error: (err) => {
        console.error(err);
        this.alertService.error('Error', 'No se pudo actualizar la reserva.');
        this.cargando.set(false);
      }
    });
  }

  irANuevaReserva() {
    this.router.navigate(['/admin/reservas/nueva']); 
  }
  
  // Helper para filtrar solo las pendientes en la tabla principal del dashboard
  get reservasPendientes() {
    return this.listaReservas().filter(r => r.estado === 'PENDIENTE');
  }

  verConfirmadas() {
    this.router.navigate(['/admin/reservas/listado', 'CONFIRMADA']);
  }

  async cerrarSesion() {
    const confirmado = await this.alertService.confirm(
      '¿Cerrar Sesión?',
      'Tendrás que ingresar tus credenciales nuevamente.',
      'Sí, salir'
    );

    if (confirmado) {
      this.authService.logout();
    }
  }
}