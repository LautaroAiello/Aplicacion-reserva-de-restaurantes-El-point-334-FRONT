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
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { RestauranteService } from '../../../core/services/restaurante.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-asignar-gestor-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
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

  ngOnInit() {
    // 1. Obtenemos el ID del restaurante de la URL
    this.restauranteId = this.route.snapshot.paramMap.get('restauranteId')!;
    if (!this.restauranteId) {
      // Manejo de error si no hay ID (aunque la ruta lo requiere)
      this.errorMessage.set('No se especificó un restaurante.');
      return;
    }

    // 2. Creamos el formulario (basado en GestorCreationDTO)
    this.gestorForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      telefono: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.gestorForm.invalid) return;
    this.errorMessage.set(null);

    this.restauranteService
      .asignarGestor(this.restauranteId, this.gestorForm.value)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(
            err.error?.message || 'Error al crear el gestor.'
          );
          return throwError(() => err);
        })
      )
      .subscribe({
        next: () => {
          // ¡Éxito!
          this.snackBar.open('Gestor creado y asignado con éxito', 'Cerrar', {
            duration: 3000,
          });
          this.router.navigate(['/admin']); // Volver al dashboard
        },
      });
  }
}
