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
import { AlertService } from '../../../core/services/alert.service';
import { Router } from '@angular/router';
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
  private alertService = inject(AlertService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  protected mesaForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected cargando = signal<boolean>(true);

  // Signal para control de roles
  protected esAdmin = signal<boolean>(false);

  // Lista de mesas y columnas
  protected listaMesas = signal<MesaDTO[]>([]);
  protected displayedColumns: string[] = []; // Se define en ngOnInit según el rol

  // Estado de edición (null = modo crear)
  protected mesaEditarId = signal<number | null>(null);
  private restauranteId!: number;

  ngOnInit() {
    // 1. Determinar rol
    this.esAdmin.set(this.authService.hasRole('ADMIN'));

    // 2. Definir columnas de la tabla según rol
    if (this.esAdmin()) {
      this.displayedColumns = ['descripcion', 'capacidad', 'bloqueada', 'acciones'];
    } else {
      // El Gestor no ve acciones de editar/borrar, pero sí ve 'bloqueada' para usar el switch
      this.displayedColumns = ['descripcion', 'capacidad', 'bloqueada'];
    }

    // 3. Obtener ID del restaurante
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

    // 4. Inicializar Formulario (Solo lo usará el Admin, pero lo inicializamos igual para evitar errores)
    this.mesaForm = this.fb.group({
      descripcion: ['', Validators.required],
      capacidad: [2, [Validators.required, Validators.min(1)]],
    });

    // 5. Cargar datos
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

  // --- LÓGICA DE ADMIN (Crear / Editar / Borrar) ---

  onGuardarMesa() {
    if (!this.esAdmin() || this.mesaForm.invalid) return;
    
    this.errorMessage.set(null);
    this.cargando.set(true);

    // Recuperamos el estado actual de bloqueo si estamos editando, para no perderlo
    let bloqueadaActual = false;
    if (this.mesaEditarId()) {
        const mesaOriginal = this.listaMesas().find(m => m.id === this.mesaEditarId());
        if (mesaOriginal) bloqueadaActual = mesaOriginal.bloqueada;
    }

    const payload: MesaCreateDTO = {
        descripcion: this.mesaForm.value.descripcion,
        capacidad: this.mesaForm.value.capacidad,
        bloqueada: bloqueadaActual // Mantenemos el estado
    };

    if (this.mesaEditarId()) {
      // EDITAR
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
      // CREAR
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

  onEditar(mesa: MesaDTO) {
    if (!this.esAdmin()) return;
    this.mesaEditarId.set(mesa.id);
    this.mesaForm.patchValue({
      descripcion: mesa.descripcion,
      capacidad: mesa.capacidad,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCancelarEdicion() {
    this.mesaEditarId.set(null);
    this.mesaForm.reset({ capacidad: 2 });
  }

  async onEliminar(mesa: MesaDTO) {
    if (!this.esAdmin()) return;
    // 1. Pedir confirmación con SweetAlert
    const confirmado = await this.alertService.confirm(
      '¿Eliminar Mesa?',
      `¿Estás seguro de eliminar la mesa "${mesa.descripcion}"? Esta acción no se puede deshacer.`,
      'Sí, eliminar'
    );

    if (!confirmado) return;

    this.cargando.set(true);

    this.restauranteService
      .eliminarMesa(this.restauranteId, mesa.id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => {
          this.alertService.success('Mesa eliminada', 'La mesa ha sido eliminada del sistema.');
          this.listaMesas.update((mesas) =>
            mesas.filter((m) => m.id !== mesa.id)
          );
        },
        error: () => this.alertService.error('Error', 'No se pudo eliminar la mesa. Verifica que no tenga reservas activas.'),
      });
  }

  // --- LÓGICA COMPARTIDA (Admin y Gestor) ---

  onToggleBloqueo(mesa: MesaDTO) {
    // Invertimos el estado
    const nuevoEstado = !mesa.bloqueada;
    
    const payload: MesaCreateDTO = {
        descripcion: mesa.descripcion,
        capacidad: mesa.capacidad,
        bloqueada: nuevoEstado
    };

    this.restauranteService.actualizarMesa(this.restauranteId, mesa.id, payload)
        .subscribe({
            next: (mesaActualizada) => {
                this.listaMesas.update(mesas => 
                    mesas.map(m => m.id === mesaActualizada.id ? mesaActualizada : m)
                );
                const mensaje = nuevoEstado ? 'Mesa Bloqueada' : 'Mesa Habilitada';
                this.snackBar.open(mensaje, 'OK', { duration: 2000 });
            },
            error: () => {
                this.snackBar.open('Error al cambiar estado', 'Cerrar');
                // Revertimos visualmente recargando la lista original
                this.cargarMesas();
            }
        });
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}