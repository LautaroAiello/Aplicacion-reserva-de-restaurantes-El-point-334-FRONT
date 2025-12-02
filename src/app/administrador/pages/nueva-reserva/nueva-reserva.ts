import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';

// Servicios
import { ReservasService } from '../../../core/services/reservas.service';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';

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
import { MatDividerModule } from '@angular/material/divider'; // Asegúrate de importar esto si usas mat-divider
import { MesaDTO } from '../../../core/models/mesa.model';
import { CrearReservaPayload, ReservaAdminDTO } from '../../../core/models/reserva.model';
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
  private snackBar = inject(MatSnackBar);

  protected reservaForm!: FormGroup;
  protected mesasDisponibles = signal<MesaDTO[]>([]);
  protected cargando = signal<boolean>(false);
  protected restauranteId!: string;
  protected horariosDisponibles = signal<string[]>([]);
  
  // Cache para lógica local
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

    // 2. Inicializar Formulario (AHORA CON emailCliente)
    this.reservaForm = this.fb.group({
      nombreCliente: ['', Validators.required],
      emailCliente: ['', [Validators.required, Validators.email]], // <--- ESTO FALTABA
      telefonoCliente: [''],
      fecha: [new Date(), Validators.required],
      hora: ['', Validators.required],
      cantidadPersonas: [2, [Validators.required, Validators.min(1)]],
      observaciones: [''],
      mesasSeleccionadas: this.fb.array([], Validators.required) 
    });

    // 3. Cargar Configuración y Datos
    this.cargarConfiguracionRestaurante();
    this.cargarDatosIniciales();

    // 4. Escuchar cambios para filtrar mesas
    this.reservaForm.get('fecha')?.valueChanges.subscribe(() => this.filtrarMesas());
    this.reservaForm.get('hora')?.valueChanges.subscribe(() => this.filtrarMesas());
  }

  // --- CARGA DE HORARIOS ---
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

  // --- CARGA DE DATOS ---
  cargarDatosIniciales() {
    this.cargando.set(true);
    
    // 1. Traer TODAS las mesas
    this.restauranteService.getListarMesas(this.restauranteId).subscribe(mesas => {
      this.todasLasMesasCache = mesas; 
      
      // 2. Traer reservas para calcular conflictos
      this.reservasService.getReservasPorRestaurante(this.restauranteId).subscribe(reservas => {
        this.reservasExistentes = reservas.filter(r => r.estado !== 'CANCELADA' && r.estado !== 'RECHAZADA');
        
        this.filtrarMesas(); // Filtro inicial
        this.cargando.set(false);
      });
    });
  }

  // --- LÓGICA DE FILTRADO ---
  filtrarMesas() {
    const fFecha = this.reservaForm.get('fecha')?.value;
    const fHora = this.reservaForm.get('hora')?.value;

    if (!fFecha) return; 

    // A. Detectar si es HOY
    const fechaSeleccionada = new Date(fFecha);
    const hoy = new Date();
    fechaSeleccionada.setHours(0,0,0,0);
    hoy.setHours(0,0,0,0);
    const esHoy = fechaSeleccionada.getTime() === hoy.getTime();

    // B. Detectar ocupación por horario
    let mesasOcupadasIds = new Set<number>();

    if (fHora) {
        const fechaISO = new Date(fFecha).toISOString().split('T')[0];
        const inicioSeleccionado = new Date(`${fechaISO}T${fHora}:00`).getTime();
        const finSeleccionado = inicioSeleccionado + (4 * 60 * 60 * 1000); // 4 horas turno

        this.reservasExistentes.forEach(reserva => {
          const inicioReserva = new Date(reserva.fechaHora).getTime();
          const finReserva = inicioReserva + (4 * 60 * 60 * 1000);

          if (inicioSeleccionado < finReserva && finSeleccionado > inicioReserva) {
            reserva.mesasIds.forEach(id => mesasOcupadasIds.add(id));
          }
        });
    }

    // C. Filtro Final (Bloqueadas + Ocupadas)
    const mesasFiltradas = this.todasLasMesasCache.filter(m => {
        // 1. Si está ocupada por otra reserva -> OCULTAR
        if (mesasOcupadasIds.has(m.id)) return false;

        // 2. Si está bloqueada manualmente:
        //    - Si es HOY -> OCULTAR (no disponible ahora)
        //    - Si es FUTURO -> MOSTRAR (asumimos desbloqueo)
        if (m.bloqueada && esHoy) {
            return false;
        }

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
    if (this.reservaForm.invalid) {
      if (this.reservaForm.get('mesasSeleccionadas')?.invalid) {
        this.snackBar.open('Debes seleccionar al menos una mesa.', 'Cerrar');
      }
      return;
    }

    this.cargando.set(true);
    const formValue = this.reservaForm.value;

    const fechaISO = new Date(formValue.fecha).toISOString().split('T')[0];
    const fechaHoraISO = `${fechaISO}T${formValue.hora}:00`;

    // Incluimos Email en observación
    const datosCliente = `[Manual] Cliente: ${formValue.nombreCliente}, Email: ${formValue.emailCliente}, Tel: ${formValue.telefonoCliente}. `;
    const obsFinal = datosCliente + (formValue.observaciones || '');

    const adminId = this.authService.getUsuarioIdFromToken();
    
    // Mapeo de mesas
    const mesasParaEnviar = formValue.mesasSeleccionadas.map((id: number) => ({ mesaId: id }));

    const payload: CrearReservaPayload = {
      usuarioId: adminId!, 
      restauranteId: this.restauranteId,
      fechaHora: fechaHoraISO,
      cantidadPersonas: formValue.cantidadPersonas,
      tipo: 'MANUAL',
      
      // AHORA LO MANDAMOS EN SU PROPIO CAMPO (Asegúrate de agregar esto a la interfaz CrearReservaPayload en el servicio también)
      emailCliente: formValue.emailCliente, 
      
      // Las observaciones van limpias, sin datos ocultos
      observaciones: formValue.observaciones, 
      mesasReservadas: mesasParaEnviar
    };

    this.reservasService.crearReserva(payload)
      .pipe(
        finalize(() => this.cargando.set(false)),
        catchError(err => {
          const msg = err.error?.message || err.error || 'Error al crear reserva.';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          return throwError(() => err);
        })
      )
      .subscribe(() => {
        this.snackBar.open('¡Reserva manual creada!', 'OK', { duration: 3000 });
        this.router.navigate(['/admin']);
      });
  }

  cancelar() { this.router.navigate(['/admin']); }
}