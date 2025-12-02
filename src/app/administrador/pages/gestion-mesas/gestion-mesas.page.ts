import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, throwError, tap, finalize } from 'rxjs';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';

// Modelos
import { MesaCreateDTO, MesaDTO } from '../../../core/models/mesa.model';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-gestion-mesas-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  templateUrl: './gestion-mesas.page.html',
  styleUrl: './gestion-mesas.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionMesasPage implements OnInit {
  private fb = inject(FormBuilder);
  private restauranteService = inject(RestauranteService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  protected mesaForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected cargando = signal<boolean>(true);

  // Lista de mesas y columnas
  protected listaMesas = signal<MesaDTO[]>([]);
  protected displayedColumns: string[] = [
    'descripcion',
    'capacidad',
    'bloqueada', // Esta columna ahora tendrá el switch
    'acciones',
  ];

  // Estado de edición (null = modo crear)
  protected mesaEditarId = signal<number | null>(null);
  private restauranteId!: number;

  ngOnInit() {
    const roles = this.authService.getRestauranteRoles();
    const miRestaurante = roles.find(
      (r) => r.rol === 'ADMIN' || r.rol === 'GESTOR'
    );

    if (!miRestaurante) {
      this.errorMessage.set('No se encontró un restaurante asociado.');
      this.cargando.set(false);
      return;
    }
    this.restauranteId = miRestaurante.restauranteId;

    // Formulario simplificado (Sin X, Y, ni Bloqueada)
    this.mesaForm = this.fb.group({
      descripcion: ['', Validators.required],
      capacidad: [2, [Validators.required, Validators.min(1)]],
    });

    this.cargarMesas();
  }

  cargarMesas() {
    this.cargando.set(true);
    this.restauranteService.getListarMesas(this.restauranteId).subscribe({
      next: (mesas) => {
        this.listaMesas.set(mesas);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar las mesas.');
        this.cargando.set(false);
      },
    });
  }

  // Guardar (Crear o Editar)
  onGuardarMesa() {
    if (this.mesaForm.invalid) return;
    this.errorMessage.set(null);
    this.cargando.set(true);

    const formValue = this.mesaForm.value;

    if (this.mesaEditarId()) {
      // --- MODO EDICIÓN ---
      // Buscamos la mesa original para mantener su estado de bloqueo (ya que no está en el form)
      const mesaOriginal = this.listaMesas().find(m => m.id === this.mesaEditarId());
      const estadoBloqueoActual = mesaOriginal ? mesaOriginal.bloqueada : false;

      const payload: MesaCreateDTO = {
        descripcion: formValue.descripcion,
        capacidad: formValue.capacidad,
        bloqueada: estadoBloqueoActual // Mantenemos el estado que tenía
      };

      this.restauranteService
        .actualizarMesa(this.restauranteId, this.mesaEditarId()!, payload)
        .pipe(
          finalize(() => this.cargando.set(false)),
          catchError((err) => {
            this.snackBar.open('Error al actualizar mesa', 'Cerrar');
            return throwError(() => err);
          })
        )
        .subscribe((mesaActualizada) => {
          this.snackBar.open('Mesa actualizada', 'OK', { duration: 3000 });
          this.listaMesas.update((mesas) =>
            mesas.map((m) =>
              m.id === mesaActualizada.id ? mesaActualizada : m
            )
          );
          this.onCancelarEdicion();
        });
    } else {
      // --- MODO CREACIÓN ---
      const payload: MesaCreateDTO = {
        descripcion: formValue.descripcion,
        capacidad: formValue.capacidad,
        bloqueada: false // Por defecto nace desbloqueada
      };

      this.restauranteService
        .crearMesa(this.restauranteId, payload)
        .pipe(
          finalize(() => this.cargando.set(false)),
          catchError((err) => {
            this.errorMessage.set(
              err.error?.message || 'Error al crear la mesa.'
            );
            return throwError(() => err);
          })
        )
        .subscribe((nuevaMesa) => {
          this.snackBar.open('Mesa creada con éxito', 'OK', { duration: 3000 });
          this.listaMesas.update((mesas) => [...mesas, nuevaMesa]);
          this.mesaForm.reset({
            capacidad: 2
          });
        });
    }
  }

  // Cargar datos en el formulario para editar
  onEditar(mesa: MesaDTO) {
    this.mesaEditarId.set(mesa.id);
    this.mesaForm.patchValue({
      descripcion: mesa.descripcion,
      capacidad: mesa.capacidad
      // No tocamos 'bloqueada' aquí
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCancelarEdicion() {
    this.mesaEditarId.set(null);
    this.mesaForm.reset({ capacidad: 2 });
  }

  onEliminar(mesa: MesaDTO) {
    if (!confirm(`¿Eliminar la mesa "${mesa.descripcion}"?`)) return;

    this.cargando.set(true);
    this.restauranteService
      .eliminarMesa(this.restauranteId, mesa.id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Mesa eliminada', 'OK', { duration: 3000 });
          this.listaMesas.update((mesas) =>
            mesas.filter((m) => m.id !== mesa.id)
          );
        },
        error: () => this.snackBar.open('Error al eliminar', 'Cerrar'),
      });
  }

  // --- NUEVO: Acción rápida desde la tabla ---
  onToggleBloqueo(mesa: MesaDTO) {
    // 1. Invertimos el estado
    const nuevoEstado = !mesa.bloqueada;
    
    // 2. Preparamos el payload con los mismos datos que ya tenía, solo cambiando el bloqueo
    const payload: MesaCreateDTO = {
        descripcion: mesa.descripcion,
        capacidad: mesa.capacidad,
        bloqueada: nuevoEstado
    };

    // 3. Llamamos al servicio
    this.restauranteService.actualizarMesa(this.restauranteId, mesa.id, payload)
        .subscribe({
            next: (mesaActualizada) => {
                // Actualizamos la lista localmente
                this.listaMesas.update(mesas => 
                    mesas.map(m => m.id === mesaActualizada.id ? mesaActualizada : m)
                );
                const mensaje = nuevoEstado ? 'Mesa Bloqueada' : 'Mesa Habilitada';
                this.snackBar.open(mensaje, 'OK', { duration: 2000 });
            },
            error: () => {
                // Si falla, revertimos visualmente el switch (opcional, o recargamos lista)
                this.snackBar.open('Error al cambiar estado', 'Cerrar');
                this.cargarMesas(); // Recarga forzada para asegurar consistencia
            }
        });
  }
}