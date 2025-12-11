import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AlertService } from '../../../core/services/alert.service';
// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { GestorDTO } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-asignar-gestor-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSnackBarModule, MatIconModule,
    MatProgressSpinnerModule, MatTableModule
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
   private alertService = inject(AlertService);
  protected gestorForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected restauranteId!: string;
  
  // --- MEJORAS DE UI ---
  protected cargando = signal<boolean>(false);
  protected hidePassword = signal<boolean>(true);

  protected listaGestores = signal<GestorDTO[]>([]);
  protected displayedColumns: string[] = ['nombre', 'email', 'telefono', 'acciones'];

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
    this.cargarGestores();
  }

  cargarGestores() {
    this.cargando.set(true);
    this.restauranteService.listarGestores(this.restauranteId).subscribe({
      next: (gestores) => {
        this.listaGestores.set(gestores);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  onSubmit() {
    if (this.gestorForm.invalid) return;
    
    this.errorMessage.set(null);
    this.cargando.set(true); 

    this.restauranteService
      .asignarGestor(this.restauranteId, this.gestorForm.value)
      .pipe(
        catchError((err) => {
          const msg = err.error || err.message || 'Error al crear el gestor.';
          this.errorMessage.set(msg);
          // Opcional: Mostrar alerta de error aquí también si prefieres
          return throwError(() => err);
        }),
        finalize(() => this.cargando.set(false))
      )
      // Usamos async para esperar a que el usuario cierre la alerta
      .subscribe({
        next: async (respuestaTexto) => {
          
          // 3. LLAMADA A SWEET ALERT (Éxito)
          await this.alertService.success(
            '¡Gestor Asignado!', 
            'El gestor ha sido creado y asignado al restaurante correctamente.'
          );
          
          this.gestorForm.reset();
          this.cargarGestores(); // Actualizamos la lista de abajo
          
        },
        error: (err) => {
          // 5. LLAMADA A SWEET ALERT (Error)
          this.alertService.error('Error', 'No se pudo crear el gestor.');
        }
      });
  }

  async onEliminar(gestor: GestorDTO) {
    
    // 1. PRIMERO: Preguntar al usuario y esperar su respuesta
    const confirmado = await this.alertService.confirm(
      '¿Eliminar Gestor?',
      `¿Estás seguro de que quieres eliminar a ${gestor.nombre} ${gestor.apellido}? Perderá el acceso al panel.`,
      'Sí, eliminar'
    );

    // 2. Si el usuario canceló, no hacemos nada más.
    if (!confirmado) return;

    // 3. Si confirmó, procedemos con la lógica
    this.cargando.set(true);

    this.restauranteService.eliminarGestor(this.restauranteId, gestor.id)
      .pipe(
        // Aseguramos que el spinner se apague pase lo que pase
        finalize(() => this.cargando.set(false)) 
      )
      .subscribe({
        next: () => {
          // 4. Éxito: Mostramos mensaje verde y recargamos la lista
          this.alertService.success(
            'Gestor Eliminado', 
            'El usuario ha sido desvinculado correctamente.'
          );
          this.cargarGestores();
        },
        error: (err) => {
          // 5. Error: Mostramos mensaje rojo
          console.error(err);
          this.alertService.error(
            'Error', 
            'No se pudo eliminar al gestor. Intente nuevamente.'
          );
        }
      });
  }

  togglePassword(event: MouseEvent) {
    event.preventDefault();
    this.hidePassword.update(val => !val);
  }
  volver() { this.router.navigate(['/admin']); }
}