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
import { catchError, throwError, tap, forkJoin } from 'rxjs';
import {
  RestauranteService,
  PlatoDTO,
  PlatoCreateDTO,
  CategoriaPlatoDTO,
} from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'; // <-- Para Categorías

@Component({
  selector: 'app-gestion-menu-page',
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
    MatSelectModule,
  ],
  templateUrl: './gestion-menu.page.html',
  styleUrl: './gestion-menu.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionMenuPage implements OnInit {
  private fb = inject(FormBuilder);
  private restauranteService = inject(RestauranteService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  protected platoForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected cargando = signal<boolean>(true);

  // Signals para las listas
  protected listaPlatos = signal<PlatoDTO[]>([]);
  protected listaCategorias = signal<CategoriaPlatoDTO[]>([]);

  // Columnas para la tabla
  protected displayedColumns: string[] = [
    'nombre',
    'categoria',
    'precio',
    'estado',
    'acciones',
  ];

  private restauranteId!: string;

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
    this.restauranteId = miRestaurante.restauranteId.toString();

    // Creamos el formulario de nuevo plato
    this.platoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      precio: [0, [Validators.required, Validators.min(0)]],
      estado: ['DISPONIBLE', Validators.required], // Valor por defecto
      imagenUrl: [''],
      categoriaPlatoId: [null, Validators.required],
    });

    // Cargamos Platos y Categorías en paralelo
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.cargando.set(true);
    forkJoin({
      // Ejecuta observables en paralelo
      platos: this.restauranteService.getListarPlatos(this.restauranteId),
      categorias: this.restauranteService.getListarCategoriasPlatos(),
    })
      .pipe(
        catchError((err) => {
          this.errorMessage.set('Error al cargar los datos de la página.');
          this.cargando.set(false);
          return throwError(() => err);
        })
      )
      .subscribe(({ platos, categorias }) => {
        this.listaPlatos.set(platos);
        this.listaCategorias.set(categorias);
        this.cargando.set(false);
      });
  }

  onCrearPlato() {
    if (this.platoForm.invalid) return;
    this.errorMessage.set(null);

    const formValue = this.platoForm.value;

    const payload: PlatoCreateDTO = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      precio: formValue.precio,
      estado: formValue.estado,
      imagenUrl: formValue.imagenUrl,
      categoriaPlato: { id: formValue.categoriaPlatoId },
    };

    this.restauranteService
      .crearPlato(this.restauranteId, payload)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(
            err.error?.message || 'Error al crear el plato.'
          );
          return throwError(() => err);
        }),
        tap((nuevoPlato) => {
          // Éxito: Actualizamos la tabla
          this.listaPlatos.update((platosActuales) => [
            ...platosActuales,
            nuevoPlato,
          ]);
        })
      )
      .subscribe(() => {
        this.snackBar.open('Plato creado con éxito', 'Cerrar', {
          duration: 3000,
        });
        this.platoForm.reset({
          precio: 0,
          estado: 'DISPONIBLE',
        });
      });
  }
}
