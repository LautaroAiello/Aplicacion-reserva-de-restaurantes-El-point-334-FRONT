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
import { catchError, throwError } from 'rxjs';

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-cliente-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteRegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected registerForm: FormGroup;
  protected errorMessage: string | null = null;

  constructor() {
    this.registerForm = this.fb.group({
      // Campos requeridos por tu DTO de auth-service
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]], // Asumimos minLength
      telefono: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = null;

    this.authService
      .register(this.registerForm.value)
      .pipe(
        catchError((err) => {
          console.error('Error en el registro:', err);
          this.errorMessage =
            err.error?.message ||
            'Error al registrar la cuenta. Verifique los datos.';
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Usuario registrado:', response);
          // Opcional: Redirigir a "login" o "home"
          this.router.navigate(['/login']);
        },
      });
  }
}
