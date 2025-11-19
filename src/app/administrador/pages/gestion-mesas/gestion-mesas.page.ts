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
import { catchError, throwError, tap } from 'rxjs';
import {
  RestauranteService
} from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table'; // <-- Para la tabla
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // <-- Para "bloqueada"
import { MesaCreateDTO, MesaDTO } from '../../../core/models/mesa.model';

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

  // Signal para la lista de mesas
  protected listaMesas = signal<MesaDTO[]>([]);
  // Columnas para la tabla
  protected displayedColumns: string[] = [
    'descripcion',
    'capacidad',
    'bloqueada',
    'acciones',
  ];

  private restauranteId!: number;

  ngOnInit() {
    // 1. Obtenemos el ID del restaurante
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

    // 2. Creamos el formulario de nueva mesa
    this.mesaForm = this.fb.group({
      descripcion: ['', Validators.required],
      capacidad: [2, [Validators.required, Validators.min(1)]],
      posicionX: [0], // (Opcional, para el mapa)
      posicionY: [0], // (Opcional, para el mapa)
      bloqueada: [false],
    });

    // 3. Cargamos las mesas existentes
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

  onCrearMesa() {
    if (this.mesaForm.invalid) return;
    this.errorMessage.set(null);

    const payload: MesaCreateDTO = this.mesaForm.value;

    this.restauranteService
      .crearMesa(this.restauranteId, payload)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(
            err.error?.message || 'Error al crear la mesa.'
          );
          return throwError(() => err);
        }),
        tap((nuevaMesa) => {
          // ¡Éxito! Actualizamos la lista de mesas en el signal
          this.listaMesas.update((mesasActuales) => [
            ...mesasActuales,
            nuevaMesa,
          ]);
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Mesa creada con éxito', 'Cerrar', {
            duration: 3000,
          });
          this.mesaForm.reset({
            capacidad: 2,
            posicionX: 0,
            posicionY: 0,
            bloqueada: false,
          });
        },
      });
  }
}
