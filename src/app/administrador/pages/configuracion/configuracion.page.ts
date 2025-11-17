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
import {
  RestauranteService,
  RestauranteDTO,
  RestauranteUpdateDTO,
} from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
      direccion: this.fb.group({
        calle: ['', Validators.required],
        numero: ['', Validators.required],
        ciudad: ['', Validators.required],
        provincia: ['', Validators.required],
        pais: ['Argentina', Validators.required],
      }),
    });

    // 3. Cargamos los datos del restaurante
    this.restauranteService.getRestaurantePorId(this.restauranteId).subscribe({
      next: (data: RestauranteDTO) => {
        // 4. Rellenamos el formulario con los datos recibidos
        this.configForm.patchValue({
          nombre: data.nombre,
          telefono: data.telefono,
          horarioApertura: data.horarioApertura,
          horarioCierre: data.horarioCierre,
          direccion: data.direccion,
        });
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar los datos del restaurante.');
        this.cargando.set(false);
      },
    });
  }

  onSubmit() {
    if (this.configForm.invalid) return;
    this.errorMessage.set(null);
    this.cargando.set(true); // Mostrar spinner al guardar

    const payload: RestauranteUpdateDTO = this.configForm.value;

    this.restauranteService
      .actualizarRestaurante(this.restauranteId, payload)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(
            err.error?.message || 'Error al guardar los cambios.'
          );
          this.cargando.set(false);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.snackBar.open('¡Restaurante actualizado con éxito!', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }
}
