import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


// Servicios
import { ReservasService } from '../../../core/services/reservas.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service'; // <-- 1. Importamos el servicio
import { ReservaAdminDTO } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-historial-reservas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, 
    MatCardModule, MatTableModule, MatIconModule, 
    MatButtonModule, MatProgressSpinnerModule, MatChipsModule, 
    MatFormFieldModule, MatInputModule, 
    DatePipe
  ],
  templateUrl: './historial-reservas.page.html',
  styleUrl: './historial-reservas.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialReservasPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservasService = inject(ReservasService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService); // <-- 2. Inyectamos el AlertService

  protected estadoFiltro = signal<string>('');
  protected listaReservas = signal<ReservaAdminDTO[]>([]);
  protected cargando = signal<boolean>(true);

    // --- BUSCADOR ---
  protected terminoBusqueda = signal<string>(''); // Texto del input

  // Lista computada: se actualiza automáticamente cuando cambia la lista original o el término de búsqueda
  protected reservasFiltradas = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase();
    const reservas = this.listaReservas();

    if (!termino) return reservas;

    return reservas.filter(reserva => {
      const nombreCompleto = this.getNombreCliente(reserva).toLowerCase();
      return nombreCompleto.includes(termino);
    });
  });

  protected displayedColumns: string[] = ['cliente', 'fecha', 'hora', 'mesas', 'personas', 'acciones'];

  private restauranteId!: string;

  ngOnInit() {
    // 1. Obtener ID Restaurante
    const roles = this.authService.getRestauranteRoles();
    const miRestaurante = roles.find(r => r.rol === 'ADMIN' || r.rol === 'GESTOR');
    if (miRestaurante) {
      this.restauranteId = miRestaurante.restauranteId.toString();
    }

    // 2. Leer parámetro de la URL (ej: 'CONFIRMADA')
    this.route.paramMap.subscribe(params => {
      const estado = params.get('estado');
      if (estado) {
        this.estadoFiltro.set(estado);
        this.cargarReservas(estado);
      }
    });
  }

  cargarReservas(estado: string) {
    this.cargando.set(true);
    this.reservasService.getReservasPorRestaurante(this.restauranteId).subscribe({
      next: (reservas) => {
        // Filtramos solo las del estado solicitado
        const filtradas = reservas.filter(r => r.estado === estado);
        
        // Ordenamos por fecha (más reciente primero)
        const ordenadas = filtradas.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
        
        this.listaReservas.set(ordenadas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  // --- LÓGICA DE CANCELACIÓN CON SWEET ALERT ---
  async onCancelar(reserva: ReservaAdminDTO) {
    const nombreCliente = this.getNombreCliente(reserva);

    // 1. Pedimos confirmación (esperamos la respuesta con await)
    const confirmado = await this.alertService.confirm(
      '¿Cancelar Reserva?',
      `Estás a punto de cancelar la reserva de ${nombreCliente}. Se enviará una notificación automática al cliente.`,
      'Sí, cancelar'
    );

    // Si el usuario dijo que NO o cerró el popup, paramos aquí.
    if (!confirmado) return;

    this.cargando.set(true); // Mostramos carga mientras procesa

    // 2. Llamamos al servicio para cambiar estado a CANCELADA
    this.reservasService.actualizarEstadoReserva(reserva.id, 'CANCELADA').subscribe({
      next: () => {
        // Éxito: Mostramos alerta verde
        this.alertService.success(
          'Reserva Cancelada', 
          'La reserva ha sido cancelada y se ha notificado al cliente correctamente.'
        );
        // Recargamos la lista para que desaparezca de la vista
        this.cargarReservas(this.estadoFiltro());
      },
      error: () => {
        this.cargando.set(false);
        // Error: Mostramos alerta roja
        this.alertService.error(
          'Error', 
          'No se pudo cancelar la reserva. Por favor, intente nuevamente.'
        );
      }
    });
  }

  // Helper para nombre (detecta si es manual)
  getNombreCliente(row: ReservaAdminDTO): string {
    if (row.observaciones?.includes('[Manual]')) {
      const match = row.observaciones.match(/Cliente:\s*([^,]+)/);
      return match ? match[1] + ' (Manual)' : 'Cliente Manual';
    }
    return `${row.nombreCliente} ${row.apellidoCliente}`;
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}