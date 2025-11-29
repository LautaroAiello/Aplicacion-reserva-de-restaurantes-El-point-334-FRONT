import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importar DatePipe
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReservasService } from '../../../core/services/reservas.service';
import { RestauranteService } from '../../../core/services/restaurante.service';
import {ReservaAdminDTO} from '../../../core/models/reserva.model'
import {MesaDTO} from '../../../core/models/mesa.model'

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  // Estados
  protected cargando = signal<boolean>(true);
  protected esAdmin = signal<boolean>(false); // Para mostrar/ocultar config
  protected restauranteId!: string;

  // Datos
  protected listaReservas = signal<ReservaAdminDTO[]>([]);
  protected listaMesas = signal<MesaDTO[]>([]);

  // --- WIDGETS COMPUTADOS (Se actualizan solos cuando cambia listaReservas) ---
  protected cantConfirmadas = computed(() => 
    this.listaReservas().filter(r => r.estado === 'CONFIRMADA').length
  );
  protected cantPendientes = computed(() => 
    this.listaReservas().filter(r => r.estado === 'PENDIENTE').length
  );
  
  // Para mesas ocupadas, necesitamos lógica de fecha/hora actual. 
  // Por simplicidad, aquí contamos mesas "bloqueadas" o reservadas "ahora".
  // Haremos una aproximación basada en mesas bloqueadas manualmente por ahora.
  protected cantMesasLibres = computed(() => 
    this.listaMesas().filter(m => !m.bloqueada).length
  );
  protected cantMesasOcupadas = computed(() => 
    this.listaMesas().filter(m => m.bloqueada).length 
    // + lógica futura de reservas activas
  );

  // Tabla
  protected displayedColumns: string[] = ['cliente', 'fecha', 'hora', 'mesa', 'personas', 'acciones'];

  ngOnInit() {
    // 1. Verificar Roles
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
    
    // Carga paralela (podrías usar forkJoin, pero así es legible)
    this.restauranteService.getListarMesas(+this.restauranteId).subscribe(mesas => {
      this.listaMesas.set(mesas);
    });

    this.cargarReservas();
  }

  cargarReservas() {
    this.reservasService.getReservasPorRestaurante(this.restauranteId).subscribe({
      next: (reservas) => {
        // Ordenar por fecha más reciente
        const ordenadas = reservas.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
        this.listaReservas.set(ordenadas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  // --- ACCIONES ---

  gestionarReserva(reserva: ReservaAdminDTO, nuevoEstado: string) {
    // Nota: Tu endpoint 'actualizarReserva' espera un objeto Reserva completo.
    // Deberías crear un endpoint específico PATCH o enviar todo el objeto modificado.
    // Aquí simulo enviar el objeto modificado:
    
    const reservaActualizada = { ...reserva, estado: nuevoEstado };

    this.reservasService.actualizarEstadoReserva(reserva.id, nuevoEstado).subscribe({ // OJO: Ajustar al método real de tu servicio
      next: () => {
        this.snackBar.open(`Reserva ${nuevoEstado.toLowerCase()}`, 'OK', { duration: 3000 });
        this.cargarReservas(); // Recargar lista
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al actualizar reserva', 'Cerrar');
      }
    });
  }

  irANuevaReserva() {
    // Redirige a la pantalla de crear reserva (reusamos la de cliente o creamos una admin)
    // Por ahora, asumamos que vas a crear una ruta '/admin/reservas/nueva'
    this.router.navigate(['/admin/reservas/nueva']); 
  }
  
  // Helper para filtrar solo las pendientes en la tabla principal
  get reservasPendientes() {
    return this.listaReservas().filter(r => r.estado === 'PENDIENTE');
  }
}