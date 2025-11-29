import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { RestauranteService } from '../../../core/services/restaurante.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-asignar-gestor-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSnackBarModule, MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './asignar-gestor.page.html',
  styleUrl: './asignar-gestor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignarGestorPage implements OnInit {
  private fb = inject(FormBuilder);
  private restauranteService = inject(RestauranteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  protected gestorForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected restauranteId!: string;
  
  // --- MEJORAS DE UI ---
  protected cargando = signal<boolean>(false);
  protected hidePassword = signal<boolean>(true);

  ngOnInit() {
    this.restauranteId = this.route.snapshot.paramMap.get('restauranteId')!;
    
    if (!this.restauranteId) {
      this.errorMessage.set('No se especificó un restaurante.');
      return;
    }

    this.gestorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    });
  }

  onSubmit() {
    if (this.gestorForm.invalid) return;
    
    this.errorMessage.set(null);
    this.cargando.set(true); // Activamos spinner

    this.restauranteService
      .asignarGestor(this.restauranteId, this.gestorForm.value)
      .pipe(
        catchError((err) => {
          // El backend a veces manda el mensaje de error en 'error' (texto) o 'error.message'
          const msg = err.error || err.message || 'Error al crear el gestor.';
          this.errorMessage.set(msg);
          return throwError(() => err);
        }),
        finalize(() => this.cargando.set(false)) // Desactivamos spinner al terminar (éxito o error)
      )
      .subscribe({
        next: (respuestaTexto) => {
          this.snackBar.open(respuestaTexto || 'Gestor asignado con éxito', 'Cerrar', {
            duration: 4000,
          });
          this.router.navigate(['/admin']);
        },
      });
  }

  togglePassword(event: MouseEvent) {
    event.preventDefault();
    this.hidePassword.update(val => !val);
  }
}