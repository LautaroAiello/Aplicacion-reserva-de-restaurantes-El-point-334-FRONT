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
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RestauranteDTO,
  RestauranteUpdateDTO,
} from '../../../core/models/restaurante.model';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIcon,
    MatSelectModule,
  ],
  templateUrl: './configuracion.page.html',
  styleUrl: './configuracion.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionPage implements OnInit {
  private fb = inject(FormBuilder);
  private restauranteService = inject(RestauranteService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  protected configForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected cargando = signal<boolean>(true);

  private restauranteId!: string;

  // --- OPCIONES PARA LOS SELECTS ---
  protected opcionesHoras = [2, 3, 4, 5, 6];
  protected opcionesPersonas = [5, 6, 7, 8, 9, 10];

  ngOnInit() {
    // 1. Obtenemos el ID del restaurante desde el AuthService
    const roles = this.authService.getRestauranteRoles();
    const miRestaurante = roles.find(
      (r) => r.rol === 'ADMIN' || r.rol === 'GESTOR'
    );

    if (!miRestaurante) {
      this.errorMessage.set(
        'No se encontró un restaurante asociado a tu cuenta.'
      );
      this.cargando.set(false);
      return;
    }
    this.restauranteId = miRestaurante.restauranteId.toString();

    // 2. Creamos el formulario (vacío por ahora)
    this.configForm = this.fb.group({
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      horarioApertura: ['', Validators.required],
      horarioCierre: ['', Validators.required],
      imagenUrl: [''],
      direccion: this.fb.group({
        calle: ['', Validators.required],
        numero: ['', Validators.required],
        ciudad: ['', Validators.required],
        provincia: ['', Validators.required],
        pais: ['Argentina', Validators.required],
      }),
      configuracion: this.fb.group({
        // Aquí guardaremos el valor en HORAS (2, 3, 4...) aunque al back vayan minutos
        tiempoAnticipacionHoras: [2, Validators.required],
        minPersonasEventoLargo: [10, Validators.required],
      }),
    });

    this.cargarDatos();
  }

  cargarDatos() {
    this.restauranteService.getRestaurantePorId(this.restauranteId).subscribe({
      next: (data: RestauranteDTO) => {
        // Lógica de Conversión: Minutos (Backend) -> Horas (Frontend)
        let horasAnticipacion = 2; // Valor por defecto
        if (data.configuracion?.tiempoAnticipacionMinutos) {
          horasAnticipacion = Math.floor(
            data.configuracion.tiempoAnticipacionMinutos / 60
          );
          // Si la conversión da menos de 2, forzamos 2 para que cuadre con el select
          if (horasAnticipacion < 2) horasAnticipacion = 2;
        }
        this.configForm.patchValue({
          nombre: data.nombre,
          telefono: data.telefono,
          horarioApertura: data.horarioApertura,
          horarioCierre: data.horarioCierre,
          imagenUrl: data.imagenUrl,
          direccion: data.direccion,
          // Si 'configuracion' viene null del backend, usamos valores por defecto vacíos
          configuracion: {
            tiempoAnticipacionHoras: horasAnticipacion, // Usamos la variable convertida
            minPersonasEventoLargo:
              data.configuracion?.minPersonasEventoLargo || 10,
          },
        });
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar los datos.');
        this.cargando.set(false);
      },
    });
  }

  onSubmit() {
    if (this.configForm.invalid) return;
    this.errorMessage.set(null);
    this.cargando.set(true); // Mostrar spinner al guardar
    const formValue = this.configForm.value;
    const minutosAnticipacion =
      formValue.configuracion.tiempoAnticipacionHoras * 60;

    const payload: RestauranteUpdateDTO = {
      nombre: formValue.nombre,
      telefono: formValue.telefono,
      horarioApertura: formValue.horarioApertura,
      horarioCierre: formValue.horarioCierre,
      imagenUrl: formValue.imagenUrl,
      direccion: formValue.direccion,
      configuracion: {
        tiempoAnticipacionMinutos: minutosAnticipacion, // Enviamos minutos
        minPersonasEventoLargo: formValue.configuracion.minPersonasEventoLargo,
      },
    };

    this.restauranteService
      .actualizarRestaurante(this.restauranteId, payload)
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.snackBar.open('¡Restaurante actualizado!', 'Cerrar', {
            duration: 3000,
          });
        },
        error: (err) => {
          this.cargando.set(false);
          this.snackBar.open('Error al guardar.', 'Cerrar', { duration: 3000 });
        },
      });
  }

  onEliminarRestaurante() {
    const confirmacion = confirm(
      '⚠️ PELIGRO: ¿Estás seguro de que quieres eliminar tu restaurante permanentemente? Esta acción no se puede deshacer.'
    );

    if (confirmacion) {
      this.cargando.set(true);
      this.restauranteService
        .eliminarRestaurante(this.restauranteId)
        .subscribe({
          next: () => {
            this.snackBar.open('Restaurante eliminado.', 'Adiós', {
              duration: 5000,
            });
            this.authService.logout(); // Cerramos sesión porque ya no tiene restaurante
          },
          error: (err) => {
            this.cargando.set(false);
            this.snackBar.open(
              'Error al eliminar. Contacta a soporte.',
              'Cerrar'
            );
          },
        });
    }
  }
}
