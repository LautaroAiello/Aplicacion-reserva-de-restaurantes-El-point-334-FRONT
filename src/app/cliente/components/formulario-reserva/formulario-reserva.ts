// src/app/cliente/components/formulario-reserva/formulario-reserva.ts
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  InputSignal,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import {
  ReservasService,
  CrearReservaPayload,
} from '../../../core/services/reservas.service';
import { AuthService } from '../../../core/services/auth.service';

// Importa TODOS los módulos de Material que vas a usar en el HTML
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-formulario-reserva',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './formulario-reserva.html',
  styleUrl: './formulario-reserva.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioReserva {
  public restauranteId: InputSignal<string> = input.required<string>();

  private fb = inject(FormBuilder);
  private reservasService = inject(ReservasService);
  private authService = inject(AuthService);

  protected estado = signal<
    'idle' | 'loading' | 'disponible' | 'error' | 'confirmada'
  >('idle');
  protected errorMessage = signal<string | null>(null);

  protected reservaForm: FormGroup;
  protected horariosDisponibles = ['19:00', '20:00', '21:00', '22:00']; // (Mock)
  protected personas = [1, 2, 3, 4, 5, 6]; // (Mock)

  constructor() {
    this.reservaForm = this.fb.group({
      fecha: [null, Validators.required],
      hora: ['', Validators.required],
      cantidadPersonas: [null, Validators.required],
    });
  }

  onConsultar() {
    if (this.reservaForm.invalid) return;
    this.estado.set('loading');
    this.errorMessage.set(null);

    const formValue = this.reservaForm.value;
    const fechaISO = new Date(formValue.fecha!).toISOString().split('T')[0];
    const fechaHoraISO = `${fechaISO}T${formValue.hora}:00`;

    this.reservasService
      .consultarDisponibilidad({
        restauranteId: this.restauranteId(),
        fechaHora: fechaHoraISO,
        cantidadPersonas: formValue.cantidadPersonas,
      })
      .pipe(
        catchError((err) => {
          this.errorMessage.set(err.error?.message || 'Error al consultar.');
          this.estado.set('error');
          return throwError(() => err);
        })
      )
      .subscribe((response) => {
        if (response.available) {
          this.estado.set('disponible');
        } else {
          this.errorMessage.set('No hay disponibilidad para esa fecha y hora.');
          this.estado.set('error');
        }
      });
  }

  onConfirmarReserva() {
    const usuarioId = this.authService.getUsuarioIdFromToken();
    if (!usuarioId) {
      this.errorMessage.set('Debe iniciar sesión para reservar.');
      this.estado.set('error');
      return;
    }

    this.estado.set('loading');
    const formValue = this.reservaForm.value;
    const fechaISO = new Date(formValue.fecha!).toISOString().split('T')[0];
    const fechaHoraISO = `${fechaISO}T${formValue.hora}:00`;

    const payload: CrearReservaPayload = {
      usuarioId: usuarioId,
      restauranteId: this.restauranteId(),
      fechaHora: fechaHoraISO,
      cantidadPersonas: formValue.cantidadPersonas,
      tipo: 'NORMAL',
      mesasReservadas: [], // Enviamos array vacío (como pide el DTO)
    };

    this.reservasService
      .crearReserva(payload)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(
            err.error?.message || 'No se pudo crear la reserva.'
          );
          this.estado.set('disponible');
          // Volvemos al paso anterior
          return throwError(() => err);
        })
      )
      .subscribe((response) => {
        this.estado.set('confirmada'); // ¡Éxito!
      });
  }

  resetForm() {
    this.estado.set('idle');
  }
}
