import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';

// Servicios
import { ReservasService } from '../../../core/services/reservas.service';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
// Modelos
import { CrearReservaPayload, ReservaAdminDTO } from '../../../core/models/reserva.model';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MesaDTO } from '../../../core/models/mesa.model';
import { RestauranteDTO } from '../../../core/models/restaurante.model';

@Component({
  selector: 'app-admin-nueva-reserva',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatSelectModule, MatCheckboxModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './nueva-reserva.page.html',
  styleUrl: './nueva-reserva.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNuevaReservaPage implements OnInit {
  private fb = inject(FormBuilder);
  private reservasService = inject(ReservasService);
  private restauranteService = inject(RestauranteService);
  private authService = inject(AuthService);
  private router = inject(Router);
   private alertService = inject(AlertService);
  private snackBar = inject(MatSnackBar);
  protected reservaForm!: FormGroup;
  protected mesasDisponibles = signal<MesaDTO[]>([]);
  protected cargando = signal<boolean>(false);
  protected restauranteId!: string;
  protected horariosDisponibles = signal<string[]>([]);
  
  // Cache local
  private todasLasMesasCache: MesaDTO[] = [];
  private reservasExistentes: ReservaAdminDTO[] = []; 

  ngOnInit() {
    const roles = this.authService.getRestauranteRoles();
    const miRestaurante = roles.find(r => r.rol === 'ADMIN' || r.rol === 'GESTOR');
    
    if (!miRestaurante) {
      this.snackBar.open('Error: No tienes un restaurante asignado.', 'Cerrar');
      this.router.navigate(['/admin']);
      return;
    }
    this.restauranteId = miRestaurante.restauranteId.toString();

    this.reservaForm = this.fb.group({
      nombreCliente: ['', Validators.required],
      emailCliente: ['', [Validators.required, Validators.email]],
      telefonoCliente: ['', [Validators.pattern('^[0-9]*$')]],
      fecha: [new Date(), Validators.required],
      hora: ['', Validators.required],
      cantidadPersonas: [2, [Validators.required, Validators.min(1)]],
      observaciones: [''],
      // FormArray para guardar los IDs seleccionados (ej: [1, 5])
      mesasSeleccionadas: this.fb.array([], Validators.required) 
    });

    this.cargarConfiguracionRestaurante();
    this.cargarDatosIniciales();

    this.reservaForm.get('fecha')?.valueChanges.subscribe(() => this.filtrarMesas());
    this.reservaForm.get('hora')?.valueChanges.subscribe(() => this.filtrarMesas());
  }

  cargarConfiguracionRestaurante() {
    this.restauranteService.getRestaurantePorId(this.restauranteId).subscribe({
      next: (restaurante: RestauranteDTO) => {
        if (restaurante.horarioApertura && restaurante.horarioCierre) {
          const listaHorarios = this.generarIntervalos(
            restaurante.horarioApertura, 
            restaurante.horarioCierre, 
            30
          );
          this.horariosDisponibles.set(listaHorarios);
        }
      }
    });
  }

  private generarIntervalos(inicioStr: string, finStr: string, intervaloMinutos: number): string[] {
    const horarios: string[] = [];
    let actual = new Date(`2000-01-01T${inicioStr}`);
    let fin = new Date(`2000-01-01T${finStr}`);
    
    if (fin <= actual) fin.setDate(fin.getDate() + 1);

    while (actual < fin) {
      const horas = actual.getHours().toString().padStart(2, '0');
      const minutos = actual.getMinutes().toString().padStart(2, '0');
      horarios.push(`${horas}:${minutos}`);
      actual.setMinutes(actual.getMinutes() + intervaloMinutos);
    }
    return horarios;
  }

  cargarDatosIniciales() {
    this.cargando.set(true);
    
    this.restauranteService.getListarMesas(this.restauranteId).subscribe(mesas => {
      this.todasLasMesasCache = mesas; 
      
      this.reservasService.getReservasPorRestaurante(this.restauranteId).subscribe(reservas => {
        this.reservasExistentes = reservas.filter(r => r.estado !== 'CANCELADA' && r.estado !== 'RECHAZADA');
        this.filtrarMesas();
        this.cargando.set(false);
      });
    });
  }

  filtrarMesas() {
    const fFecha = this.reservaForm.get('fecha')?.value;
    const fHora = this.reservaForm.get('hora')?.value;

    if (!fFecha) return; 

    const fechaSeleccionada = new Date(fFecha);
    const hoy = new Date();
    fechaSeleccionada.setHours(0,0,0,0);
    hoy.setHours(0,0,0,0);
    const esHoy = fechaSeleccionada.getTime() === hoy.getTime();

    let mesasOcupadasIds = new Set<number>();

    if (fHora) {
        const fechaISO = new Date(fFecha).toISOString().split('T')[0];
        const inicioSeleccionado = new Date(`${fechaISO}T${fHora}:00`).getTime();
        const finSeleccionado = inicioSeleccionado + (4 * 60 * 60 * 1000);

        this.reservasExistentes.forEach(reserva => {
          const inicioReserva = new Date(reserva.fechaHora).getTime();
          const finReserva = inicioReserva + (4 * 60 * 60 * 1000);

          if (inicioSeleccionado < finReserva && finSeleccionado > inicioReserva) {
            reserva.mesasIds.forEach(id => mesasOcupadasIds.add(id));
          }
        });
    }

    const mesasFiltradas = this.todasLasMesasCache.filter(m => {
        if (mesasOcupadasIds.has(m.id)) return false;
        if (m.bloqueada && esHoy) return false;
        return true; 
    });

    this.mesasDisponibles.set(mesasFiltradas);
  }

  onMesaChange(mesaId: number, isChecked: boolean) {
    const mesasArray = this.reservaForm.get('mesasSeleccionadas') as FormArray;
    if (isChecked) {
      mesasArray.push(new FormControl(mesaId));
    } else {
      const index = mesasArray.controls.findIndex(x => x.value === mesaId);
      mesasArray.removeAt(index);
    }
  }

  onSubmit() {
    // Validar que haya mesas seleccionadas (Angular a veces no marca inválido el FormArray vacío si no se tocó)
    const mesasArray = this.reservaForm.get('mesasSeleccionadas') as FormArray;
    if (this.reservaForm.invalid || mesasArray.length === 0) {
      this.reservaForm.markAllAsTouched();
      this.snackBar.open('Debes completar todos los campos y seleccionar al menos una mesa.', 'Cerrar');
      return;
    }

    this.cargando.set(true);
    const formValue = this.reservaForm.value;

    const fechaISO = new Date(formValue.fecha).toISOString().split('T')[0];
    const fechaHoraISO = `${fechaISO}T${formValue.hora}:00`;
    const obsFinal = formValue.observaciones || '';
    const adminId = this.authService.getUsuarioIdFromToken();

    // -----------------------------------------------------------
    // ⚠️ TRANSFORMACIÓN CRÍTICA: number[] -> {mesaId: number}[]
    // -----------------------------------------------------------
    // 'formValue.mesasSeleccionadas' es un array de números [1, 2]
    // 'mesasReservadas' debe ser [{mesaId: 1}, {mesaId: 2}]
    const listaDeIds: number[] = formValue.mesasSeleccionadas;


    const payload: CrearReservaPayload = {
      usuarioId: Number(adminId), 
      restauranteId: Number(this.restauranteId),
      fechaHora: fechaHoraISO,
      cantidadPersonas: formValue.cantidadPersonas,
      tipo: 'MANUAL',
      nombreClienteManual: formValue.nombreCliente, 
      emailCliente: formValue.emailCliente,
      observaciones: obsFinal, 
      
      // Aquí pasamos el array transformado
      mesaIds: listaDeIds 
    };

    console.log('PAYLOAD CORREGIDO:', JSON.stringify(payload, null, 2));

    this.reservasService.crearReserva(payload)
      .pipe(
        finalize(() => this.cargando.set(false)),
        catchError(err => {
          // Intentamos mostrar el mensaje exacto del backend (ej: "Capacidad insuficiente")
          const msg = err.error?.message || err.error || 'Error al crear la reserva.';
          this.alertService.error('Error', msg);
          return throwError(() => err);
        })
      )
      // 3. AQUÍ HACEMOS EL CALLBACK ASYNC PARA ESPERAR AL USUARIO
      .subscribe(async () => {
        
        await this.alertService.success(
          '¡Reserva Creada!', 
          'La reserva manual se ha guardado correctamente y está en la lista de pendientes.'
        );
        
        // La navegación ocurre SOLO después de que el usuario cierra la alerta
        this.router.navigate(['/admin']);
      });
  }

  cancelar() { this.router.navigate(['/admin']); }
  volver() {
    this.router.navigate(['/admin']);
  }
}