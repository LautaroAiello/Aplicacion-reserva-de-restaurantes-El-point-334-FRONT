import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-cliente-login-page',
  standalone: true,
  // IMPORTANTE: Añade todos los módulos necesarios aquí
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteLoginPage {
  // Inyección de dependencias (estilo moderno)
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected loginForm: FormGroup;
  protected errorMessage: string | null = null;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // El nombre 'contrasena' debe coincidir con el payload que espera tu API
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = null; // Limpiar errores previos

    this.authService
      .login(this.loginForm.value)
      .pipe(
        catchError((err) => {
          // Manejo de error
          console.error('Error en el login:', err);
          this.errorMessage =
            'Email o contraseña incorrectos. Por favor, intente de nuevo.';
          return throwError(() => err); // Propaga el error
        })
      )
      .subscribe({
        next: (response) => {
          // ¡Éxito!
          console.log('Login exitoso', response.token);
          this.router.navigate(['/home']); // Redirigir al home
        },
      });
  }
}
