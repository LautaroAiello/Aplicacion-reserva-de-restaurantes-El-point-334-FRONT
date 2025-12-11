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
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // 💡 NUEVO IMPORT

import {
  RestauranteDTO,
  RestauranteUpdateDTO,
} from '../../../core/models/restaurante.model';

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
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule, // 💡 AGREGAR AQUÍ
  ],
  templateUrl: './configuracion.page.html',
  styleUrl: './configuracion.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionPage implements OnInit {
  private fb = inject(FormBuilder);
  private restauranteService = inject(RestauranteService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  protected configForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected cargando = signal<boolean>(true);

  private restauranteId!: string;

  protected opcionesHoras = [2, 3, 4, 5, 6];
  protected opcionesPersonas = [5, 6, 7, 8, 9, 10];

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
        latitud: [null],
        longitud: [null]
      }),
      configuracion: this.fb.group({
        tiempoAnticipacionHoras: [2, Validators.required],
        minPersonasEventoLargo: [10, Validators.required],
        // 💡 1. AGREGAMOS EL CAMPO AL FORMULARIO
        mostrarPrecios: [true, Validators.required] 
      }),
    });

    this.cargarDatos();
  }

  cargarDatos() {
    this.restauranteService.getRestaurantePorId(this.restauranteId).subscribe({
      next: (data: RestauranteDTO) => {
        let horasAnticipacion = 2;
        if (data.configuracion?.tiempoAnticipacionMinutos) {
          horasAnticipacion = Math.floor(data.configuracion.tiempoAnticipacionMinutos / 60);
          if (horasAnticipacion < 2) horasAnticipacion = 2;
        }

        this.configForm.patchValue({
          nombre: data.nombre,
          telefono: data.telefono,
          horarioApertura: data.horarioApertura,
          horarioCierre: data.horarioCierre,
          imagenUrl: data.imagenUrl,
          direccion: { ...data.direccion },
          configuracion: {
            tiempoAnticipacionHoras: horasAnticipacion,
            minPersonasEventoLargo: data.configuracion?.minPersonasEventoLargo || 10,
            // 💡 2. MAPEAMOS EL VALOR QUE VIENE DEL BACKEND
            mostrarPrecios: data.configuracion?.mostrarPrecios ?? true
          },
        });
        this.cargando.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar los datos.');
        this.cargando.set(false);
      },
    });
  }

  onSubmit() {
    if (this.configForm.invalid) return;
    this.errorMessage.set(null);
    this.cargando.set(true);
    
    const formValue = this.configForm.value;
    const minutosAnticipacion = formValue.configuracion.tiempoAnticipacionHoras * 60;

    // 💡 3. AQUÍ ESTABA EL ERROR: AGREGAMOS EL CAMPO AL PAYLOAD
    const payload: RestauranteUpdateDTO = {
      nombre: formValue.nombre,
      telefono: formValue.telefono,
      horarioApertura: formValue.horarioApertura,
      horarioCierre: formValue.horarioCierre,
      imagenUrl: formValue.imagenUrl,
      direccion: formValue.direccion,
      configuracion: {
        tiempoAnticipacionMinutos: minutosAnticipacion,
        minPersonasEventoLargo: formValue.configuracion.minPersonasEventoLargo,
        mostrarPrecios: formValue.configuracion.mostrarPrecios // <--- ESTE FALTABA
      },
    };

    this.restauranteService.actualizarRestaurante(this.restauranteId, payload)
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.alertService.success('Restaurante actualizado!', 'Datos guardados correctamente.');
        },
        error: () => {
          this.cargando.set(false);
          this.alertService.error('Error', 'Hubo un problema al guardar.');
        },
      });
  }

  onEliminarRestaurante() {
    // ... (tu lógica de eliminar queda igual)
    const confirmacion = confirm('⚠️ PELIGRO: ¿Estás seguro?');
    if (confirmacion) {
        this.cargando.set(true);
        this.restauranteService.eliminarRestaurante(this.restauranteId).subscribe({
            next: () => {
                this.snackBar.open('Restaurante eliminado.', 'Adiós', { duration: 5000 });
                this.authService.logout();
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('Error al eliminar.', 'Cerrar');
            }
        });
    }
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}