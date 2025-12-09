import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar'; // 💡 Para notificaciones

import { ReservasService } from '../../../core/services/reservas.service';
import { AuthService } from '../../../core/services/auth.service'; // 💡 Necesario para cancelar
import { ReservaCard } from '../../components/reserva-card/reserva-card';
import { MisReservasResponse } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-cliente-reservas-page',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReservaCard,
  ],
  templateUrl: './reservas.html',
  styleUrl: './reservas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteReservasPage implements OnInit {
  private reservasService = inject(ReservasService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // 💡 Usamos Signals para mejor control del estado y actualizaciones puntuales
  public reservas = signal<MisReservasResponse[]>([]);
  public loading = signal<boolean>(true);

  ngOnInit() {
    this.cargarReservas();
  }

  cargarReservas() {
    this.loading.set(true);
    this.reservasService.getMisReservas().subscribe({
      next: (data) => {
        // Ordenamos por fecha descendente (las más recientes primero)
        const ordenadas = data.sort((a, b) => 
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
        );
        this.reservas.set(ordenadas);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando reservas', err);
        this.loading.set(false);
      }
    });
  }

  // 💡 MÉTODO PARA CANCELAR
  // Este método debe ser llamado cuando el componente hijo (ReservaCard) emita el evento
  onCancelarReserva(reservaId: string) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      return;
    }

    const usuarioId = Number(this.authService.getUsuarioIdFromToken());
    const idNumerico = Number(reservaId); // Aseguramos que sea número para el backend

    this.reservasService.cancelarReserva(idNumerico, usuarioId).subscribe({
      next: () => {
        this.snackBar.open('Reserva cancelada correctamente', 'Cerrar', { duration: 3000 });

        // 💡 ACTUALIZACIÓN OPTIMISTA:
        // Buscamos la reserva en la lista local y le cambiamos el estado a 'CANCELADA'
        // Esto evita tener que recargar toda la página.
        this.reservas.update((lista) => 
          lista.map((reserva) => {
            if (reserva.id === reservaId) {
              return { ...reserva, estado: 'CANCELADA' };
            }
            return reserva;
          })
        );
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al cancelar la reserva', 'Cerrar', { duration: 3000 });
      }
    });
  }
}