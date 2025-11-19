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
import {
  RestauranteService
} from '../../../core/services/restaurante.service';
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

  ngOnInit() {
    this.registerForm = this.fb.group({
      // ... (el resto de tu formulario que ya estaba bien)
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      horarioApertura: ['09:00:00', Validators.required],
      horarioCierre: ['23:00:00', Validators.required],
      direccion: this.fb.group({
        calle: ['', Validators.required],
        numero: ['', Validators.required],
        ciudad: ['', Validators.required],
        provincia: ['', Validators.required],
        pais: ['Argentina', Validators.required],
      }),
      nombreUsuario: ['', Validators.required],
      apellidoUsuario: ['', Validators.required],
      emailUsuario: ['', [Validators.required, Validators.email]],
      passwordUsuario: ['', [Validators.required, Validators.minLength(8)]],
      telefonoUsuario: [''],
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null); // <-- Usa .set() para actualizar el signal

    const payload: RegistroRestauranteDTO = this.registerForm.value;

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
