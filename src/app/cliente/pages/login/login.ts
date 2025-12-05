import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { MatDivider } from '@angular/material/divider';

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
    MatDivider,
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
  protected errorMessage = signal<string | null>(null);

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

    this.errorMessage.set(null); // Limpiar errores previos

    this.authService.login(this.loginForm.value).pipe(
      catchError((err) => {
        console.error('Error en el login:', err);
        // Mensaje amigable si falla
        if (err.status === 401 || err.status === 403) {
            this.errorMessage.set('Email o contraseña incorrectos.');
        } else {
            this.errorMessage.set('Error de conexión. Intente más tarde.');
        }
        return throwError(() => err);
      })
    ).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);
        
        // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
        // Si por error un Admin/Gestor se loguea aquí, lo mandamos a su panel
        if (this.authService.hasRole('ADMIN') || this.authService.isGestor()) {
           this.router.navigate(['/admin']);
        } else {
           // Cliente normal -> Home
           this.router.navigate(['/home']);
        }
      }
    });
  }
}
