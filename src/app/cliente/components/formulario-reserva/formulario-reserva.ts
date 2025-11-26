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
// Servicios
import { ReservasService } from '../../../core/services/reservas.service';
import { AuthService } from '../../../core/services/auth.service';
import { RestauranteService } from '../../../core/services/restaurante.service'; // <--- IMPORTAR

// Material Imports (Mismos que tenías)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
// Modelos
import { CrearReservaPayload } from '../../../core/models/reserva.model';
import { MesaDTO } from '../../../core/models/mesa.model';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ReservaExitosaDialog } from '../../../shared/reserva-exitosa-dialog/reserva-exitosa-dialog';

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
    MatDialogModule
  ],
  templateUrl: './formulario-reserva.html',
  styleUrl: './formulario-reserva.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioReserva {
  public restauranteId: InputSignal<string> = input.required<string>();

  private fb = inject(FormBuilder);
  private reservasService = inject(ReservasService);
  private restauranteService = inject(RestauranteService); // <--- INYECTAR
  private authService = inject(AuthService);

  private dialog = inject(MatDialog);
  private router = inject(Router);

  protected estado = signal<'idle' | 'loading' | 'disponible' | 'error' | 'confirmada'>('idle');
  protected errorMessage = signal<string | null>(null);
  
  // --- NUEVOS SIGNALS PARA EL MAPA ---
  protected mesas = signal<MesaDTO[]>([]); 
  protected mesasSeleccionadas = signal<Set<number>>(new Set());
  // ----------------------------------

  protected reservaForm: FormGroup;
  protected horariosDisponibles = ['12:00', '13:00', '20:00', '21:00', '22:00'];
  protected personas = [1, 2, 3, 4, 5, 6, 7, 8];

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
    // Limpiamos selección previa
    this.mesasSeleccionadas.set(new Set()); 

    // 1. Primero consultamos disponibilidad general (tu lógica actual)
    // NOTA: Idealmente, este endpoint debería devolver las mesas libres.
    // Si no, llamamos a obtener las mesas del restaurante.
    
    // Simulamos que la consulta de disponibilidad fue OK y traemos las mesas
    this.restauranteService.getListarMesas(+this.restauranteId())
      .pipe(
        catchError((err) => {
            this.errorMessage.set('No se pudo cargar el mapa del restaurante.');
            this.estado.set('error');
            return throwError(() => err);
        })
      )
      .subscribe((mesasData) => {
         // Filtramos mesas visualmente si queremos (opcional)
         this.mesas.set(mesasData);
         this.estado.set('disponible');
      });
  }

  // --- Lógica para seleccionar mesas en el mapa ---
  toggleMesa(mesaId: number) {
    const seleccionActual = new Set(this.mesasSeleccionadas());
    
    if (seleccionActual.has(mesaId)) {
      seleccionActual.delete(mesaId);
    } else {
      // Opcional: Validar si la suma de capacidades supera lo pedido
      seleccionActual.add(mesaId);
    }
    
    this.mesasSeleccionadas.set(seleccionActual);
  }

  onConfirmarReserva() {
    const usuarioId = this.authService.getUsuarioIdFromToken();
    if (!usuarioId) {
      this.errorMessage.set('Debe iniciar sesión para reservar.');
      this.estado.set('error');
      return;
    }

    // Validación visual: El usuario debe elegir al menos una mesa
    if (this.mesasSeleccionadas().size === 0) {
        // Puedes usar un snackbar aquí mejor
        alert("Por favor, selecciona una mesa en el mapa.");
        return;
    }

    this.estado.set('loading');
    const formValue = this.reservaForm.value;
    const fechaISO = new Date(formValue.fecha!).toISOString().split('T')[0];
    const fechaHoraISO = `${fechaISO}T${formValue.hora}:00`;

    // Convertimos el Set de IDs al formato que espera el backend
    const mesasParaEnviar = Array.from(this.mesasSeleccionadas()).map(id => ({ mesaId: id }));

    const payload: CrearReservaPayload = {
      usuarioId: usuarioId,
      restauranteId: this.restauranteId(),
      fechaHora: fechaHoraISO,
      cantidadPersonas: formValue.cantidadPersonas,
      tipo: 'NORMAL', 
      mesasReservadas: mesasParaEnviar, // <--- ENVIAMOS LAS MESAS SELECCIONADAS
      observaciones: 'Reserva desde Web'
    };

    this.reservasService.crearReserva(payload)
      .pipe(
        catchError((err) => {
          // Manejo de errores del backend (ej: solapamiento, capacidad)
          this.errorMessage.set(err.error?.message || 'No se pudo crear la reserva.');
          this.estado.set('error'); // O volver a 'disponible' para que corrija
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.estado.set('confirmada');
          this.abrirPopUpExito();
        },
        error: (err) => {
          // Aquí capturas el mensaje "Conflicto de disponibilidad..."
          const mensajeDelBack = err.error?.message || 'Error desconocido al reservar.';
    
          this.errorMessage.set(mensajeDelBack); 
          this.estado.set('error'); // Esto mostrará el div de error en tu HTML
        }
      });
      // .subscribe(() => {
      //   this.estado.set('confirmada');
      //   this.abrirPopUpExito();
      // });
  }

  abrirPopUpExito() {
      const dialogRef = this.dialog.open(ReservaExitosaDialog, {  
      width: '400px',
      disableClose: true // Obliga a pulsar el botón para cerrar
      });
    
      dialogRef.afterClosed().subscribe(() => {
        // Cuando el usuario cierra el popup, lo redirigimos
        this.router.navigate(['/home']); 
        // Opcional: ir a 'mis-reservas'
      });
  }

  resetForm() {
    this.estado.set('idle');
    this.mesasSeleccionadas.set(new Set());
  }
}