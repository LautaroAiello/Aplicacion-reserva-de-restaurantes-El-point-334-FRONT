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
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { Router } from '@angular/router';
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
import {
  CategoriaPlatoDTO,
  PlatoCreateDTO,
  PlatoDTO,
} from '../../../core/models/platos.model';

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
  private alertService = inject(AlertService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  protected platoForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected cargando = signal<boolean>(true);

  protected platoEditarId = signal<number | null>(null);

  // Signals para las listas
  protected listaPlatos = signal<PlatoDTO[]>([]);
  protected listaCategorias = signal<CategoriaPlatoDTO[]>([]);

  // Columnas para la tabla
  protected displayedColumns: string[] = [
    'imagen',
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
    // this.cargarDatosIniciales();
    this.cargarCategorias();
    this.cargarPlatos();
  }
  cargarCategorias() {
    // VOLVEMOS AL CÓDIGO ORIGINAL Y LIMPIO
    this.restauranteService.getListarCategoriasPlatos().subscribe({
      next: (cats) => {
        this.listaCategorias.set(cats);
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.errorMessage.set('No se pudieron cargar las categorías.');
        // YA NO USAMOS DATOS FALSOS AQUÍ
      },
    });
  }

  cargarPlatos() {
    this.cargando.set(true);
    this.restauranteService.getListarPlatos(this.restauranteId).subscribe({
      next: (platos) => {
        this.listaPlatos.set(platos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando platos (Posible bucle en backend):', err);
        // IMPORTANTE: Si falla, desactivamos el spinner igual para que se vea el formulario
        this.cargando.set(false);

        // Opcional: Mostrar mensaje amigable
        if (err.status === 500) {
          this.errorMessage.set(
            'Error del servidor al listar platos. Sin embargo, puedes intentar crear nuevos.'
          );
        }
      },
    });
  }

  onGuardarPlato() {
    if (this.platoForm.invalid) return;
    this.errorMessage.set(null);

    const formValue = this.platoForm.value;

    // Armamos el DTO
    const payload: PlatoCreateDTO = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      precio: formValue.precio,
      estado: formValue.estado,
      imagenUrl: formValue.imagenUrl,
      categoriaPlato: { id: formValue.categoriaPlatoId },
    };

    // DECISIÓN: ¿Estamos editando o creando?
    if (this.platoEditarId()) {
      // --- MODO EDICIÓN (PUT) ---
      this.restauranteService
        .actualizarPlato(this.restauranteId, this.platoEditarId()!, payload)
        .pipe(
          tap((platoActualizado) => {
            // Ayuda visual: recuperar el nombre de la categoría para la tabla
            const cat = this.listaCategorias().find(
              (c) => c.id === formValue.categoriaPlatoId
            );
            if (cat) platoActualizado.categoriaPlato = cat;

            // Actualizamos el plato en la lista local
            this.listaPlatos.update((platos) =>
              platos.map((p) =>
                p.id === platoActualizado.id ? platoActualizado : p
              )
            );
          })
        )
        .subscribe({
          next: () => {
             this.alertService.success('¡Plato Actualizado!', 'Los cambios se han guardado correctamente.');
            this.onCancelarEdicion(); // Resetea el form y el modo
          },
          error: (err) => this.alertService.error('Error', 'No se pudo actualizar el plato.'),
        });
    } else {
      // --- MODO CREACIÓN (POST) ---
      // (Este es tu código anterior)
      this.restauranteService
        .crearPlato(this.restauranteId, payload)
        .pipe(
          tap((nuevoPlato) => {
            const cat = this.listaCategorias().find(
              (c) => c.id === formValue.categoriaPlatoId
            );
            if (cat) nuevoPlato.categoriaPlato = cat;

            this.listaPlatos.update((platos) => [...platos, nuevoPlato]);
          })
        )
        .subscribe({
          next: () => {
            // 3. Éxito con SweetAlert
            this.alertService.success('¡Plato Creado!', 'El nuevo plato se ha añadido al menú.');
            this.platoForm.reset({ precio: 0, estado: 'DISPONIBLE' });
          },
          error: (err) => {
             this.alertService.error('Error', 'No se pudo crear el plato.');
          },
        });
    }
  }

  // --- LÓGICA DE ELIMINAR ---
  async onEliminar(plato: PlatoDTO) {
    // 1. Confirmación
    const confirmado = await this.alertService.confirm(
      '¿Eliminar Plato?',
      `¿Estás seguro de eliminar "${plato.nombre}"? Esta acción no se puede deshacer.`,
      'Sí, eliminar'
    );

    if (!confirmado) return;

    // 2. Llamada al servicio
    this.restauranteService
      .eliminarPlato(this.restauranteId, plato.id)
      .subscribe({
        next: () => {
          // Éxito
          this.alertService.success('Plato Eliminado', 'El plato ha sido eliminado del menú.');
          this.listaPlatos.update((platos) =>
            platos.filter((p) => p.id !== plato.id)
          );
        },
        error: (err) => {
          // Error
          this.alertService.error('Error', 'No se pudo eliminar el plato.');
        },
      });
  }

  // --- LÓGICA DE PREPARAR EDICIÓN ---
  onEditar(plato: PlatoDTO) {
    // 1. Guardamos el ID que estamos editando
    this.platoEditarId.set(plato.id);

    // 2. Rellenamos el formulario con los datos del plato
    this.platoForm.patchValue({
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: plato.precio,
      estado: plato.estado,
      imagenUrl: plato.imagenUrl,
      categoriaPlatoId: plato.categoriaPlato?.id, // Asignamos el ID de la categoría
    });

    // 3. Hacemos scroll hacia arriba (opcional, por si la lista es larga)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- LÓGICA DE CANCELAR EDICIÓN ---
  onCancelarEdicion() {
    this.platoEditarId.set(null); // Volvemos a modo creación
    this.platoForm.reset({ precio: 0, estado: 'DISPONIBLE' });
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}
