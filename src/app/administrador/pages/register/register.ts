// src/app/administrador/pages/register/register.page.ts
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal, // <-- Importa signal
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
import { catchError, throwError } from 'rxjs';

// Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // <-- Importa MatSnackBarModule
import { RegistroRestauranteDTO } from '../../../core/models/restaurante.model';

@Component({
  selector: 'app-administrador-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatStepperModule,
    MatSnackBarModule, // <-- Añade MatSnackBarModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministradorRegisterPage implements OnInit {
  // <-- El nombre de clase correcto
  private fb = inject(FormBuilder);
  private restauranteService = inject(RestauranteService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  protected registerForm!: FormGroup;
  // Define errorMessage como un signal
  protected errorMessage = signal<string | null>(null);

  get restauranteGroup(): FormGroup {
    return this.registerForm.get('restaurante') as FormGroup;
  }

  get direccionGroup(): FormGroup {
    return this.registerForm.get('direccion') as FormGroup;
  }

  get adminGroup(): FormGroup {
    return this.registerForm.get('admin') as FormGroup;
  }

  // Getter nuevo para el grupo fiscal
  get fiscalGroup(): FormGroup {
    return this.registerForm.get('fiscal') as FormGroup;
  }

  ngOnInit() {
    this.registerForm = this.fb.group({
      // GRUPO  Datos del Restaurante
      restaurante: this.fb.group({
        nombre: ['', Validators.required],
        telefono: ['', Validators.required],
        horarioApertura: ['09:00', Validators.required], // Nota: sin segundos para el input type="time"
        horarioCierre: ['23:00', Validators.required],
        imagenUrl: [''],
      }),

      fiscal: this.fb.group({
        cuit: ['', Validators.required],
        razonSocial: ['', Validators.required],
      }),

      // GRUPO  Dirección (Ya estaba agrupado, perfecto)
      direccion: this.fb.group({
        calle: ['', Validators.required],
        numero: ['', Validators.required],
        ciudad: ['', Validators.required],
        provincia: ['', Validators.required],
        pais: ['Argentina', Validators.required],
      }),

      // GRUPO  Datos del Admin
      admin: this.fb.group({
        nombreUsuario: ['', Validators.required],
        apellidoUsuario: ['', Validators.required],
        emailUsuario: ['', [Validators.required, Validators.email]],
        passwordUsuario: ['', [Validators.required, Validators.minLength(8)]],
        telefonoUsuario: [''],
      }),
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null); // <-- Usa .set() para actualizar el signal

    const formValue = this.registerForm.value;

    const payload: RegistroRestauranteDTO = {
      // Sacamos los datos del grupo 'restaurante'
      nombre: formValue.restaurante.nombre,
      telefono: formValue.restaurante.telefono,
      horarioApertura: formValue.restaurante.horarioApertura + ':00', // Agregamos segundos si hace falta
      horarioCierre: formValue.restaurante.horarioCierre + ':00',
      imagenUrl: formValue.restaurante.imagenUrl,

      cuit: formValue.fiscal.cuit,
      razonSocial: formValue.fiscal.razonSocial,
      // El grupo direccion ya coincide
      direccion: formValue.direccion,

      // Sacamos los datos del grupo 'admin'
      nombreUsuario: formValue.admin.nombreUsuario,
      apellidoUsuario: formValue.admin.apellidoUsuario,
      emailUsuario: formValue.admin.emailUsuario,
      passwordUsuario: formValue.admin.passwordUsuario,
      telefonoUsuario: formValue.admin.telefonoUsuario,
    };

    this.restauranteService
      .registrarRestaurante(payload)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(
            // <-- Usa .set()
            err.error?.message || 'Error al registrar el restaurante.'
          );
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open(
            '¡Restaurante registrado con éxito! Inicia sesión para continuar.',
            'Cerrar',
            { duration: 5000 }
          );
          this.router.navigate(['/admin/login']);
        },
      });
  }
}
