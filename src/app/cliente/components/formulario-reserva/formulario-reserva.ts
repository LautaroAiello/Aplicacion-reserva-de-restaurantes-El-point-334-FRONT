import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  InputSignal,
  signal,
  effect
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Servicios
import { ReservasService } from '../../../core/services/reservas.service';
import { AuthService } from '../../../core/services/auth.service';
import { RestauranteService } from '../../../core/services/restaurante.service';

// Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Modelos y Componentes
import { ReservaExitosaDialog } from '../../../shared/reserva-exitosa-dialog/reserva-exitosa-dialog';
import { MesaDTO } from '../../../core/models/mesa.model';
import { CrearReservaPayload } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-formulario-reserva',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './formulario-reserva.html',
  styleUrl: './formulario-reserva.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioReserva {
  // Inputs (Vienen como string desde el router/html a veces)
  public restauranteId: InputSignal<string> = input.required<string>();
  
  public horarioApertura = input<string>('09:00'); 
  public horarioCierre = input<string>('23:00');

  private fb = inject(FormBuilder);
  private reservasService = inject(ReservasService);
  private restauranteService = inject(RestauranteService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Estados
  protected estado = signal<'loading' | 'disponible' | 'error' | 'confirmada'>('loading');
  protected errorMessage = signal<string | null>(null);
  
  // Datos
  protected mesas = signal<MesaDTO[]>([]); 
  protected mesasSeleccionadas = signal<Set<number>>(new Set());
  protected mesasOcupadasIds = signal<Set<number>>(new Set()); 
  protected rangoHorarios = signal<string[]>([]);

  protected reservaForm: FormGroup;
  protected personas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  constructor() {
    this.reservaForm = this.fb.group({
      fecha: [null, Validators.required],
      hora: ['', Validators.required],
      cantidadPersonas: [null, Validators.required],
    });

    // EFECTO 1: Cargar mesas (Convertimos string a number con +)
    effect(() => {
      const id = this.restauranteId();
      if (id) {
        this.cargarMesas(Number(id)); // Solución error: number not assignable to string
      }
    });

    // EFECTO 2: Horarios
    effect(() => {
      this.generarRangoHorarios(this.horarioApertura(), this.horarioCierre());
    });
  }

  cargarMesas(id: number) {
    this.estado.set('loading');
    this.restauranteService.getListarMesas(id).subscribe({
      next: (mesasData) => {
        this.mesas.set(mesasData);
        this.estado.set('disponible');
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('No se pudo cargar el mapa del restaurante.');
        this.estado.set('error');
      }
    });
  }

  // Genera la lista estricta basada en apertura y cierre
  private generarRangoHorarios(inicio: string, fin: string) {
    // Protección: Si los datos no han llegado, no hacemos nada
    if (!inicio || !fin) return;

    // Aseguramos formato HH:mm (quitando segundos si vienen del backend: 18:00:00 -> 18:00)
    const horaInicioStr = inicio.substring(0, 5);
    const horaFinStr = fin.substring(0, 5);

    const lista: string[] = [];
    
    // Creamos fechas base para comparar (usamos una fecha arbitraria, ej: hoy)
    const fechaBase = new Date();
    fechaBase.setSeconds(0);
    fechaBase.setMilliseconds(0);

    const [hInicio, mInicio] = horaInicioStr.split(':').map(Number);
    const [hFin, mFin] = horaFinStr.split(':').map(Number);

    // Configuramos la fecha de INICIO
    let fechaActual = new Date(fechaBase);
    fechaActual.setHours(hInicio, mInicio, 0);

    // Configuramos la fecha de CIERRE
    let fechaLimite = new Date(fechaBase);
    fechaLimite.setHours(hFin, mFin, 0);

    // 💡 LÓGICA CLAVE: Si el cierre es menor al inicio (ej: Abre 20:00, Cierra 02:00)
    // significa que cierra al día siguiente. Le sumamos 1 día a la fecha límite.
    if (fechaLimite <= fechaActual) {
      fechaLimite.setDate(fechaLimite.getDate() + 1);
    }

    // Bucle: Mientras la hora actual sea menor o igual al cierre
    while (fechaActual <= fechaLimite) {
      // Formateamos a String "HH:mm"
      const horaString = fechaActual.toTimeString().substring(0, 5);
      lista.push(horaString);

      // Sumamos 30 minutos (o 60 si prefieres intervalos de 1 hora)
      fechaActual.setMinutes(fechaActual.getMinutes() + 30);
    }

    console.log(`Horarios generados para ${horaInicioStr} - ${horaFinStr}:`, lista);
    this.rangoHorarios.set(lista);
  }

  // --- VALIDACIÓN DE DISPONIBILIDAD ---
  verificarDisponibilidad() {
    const fecha = this.reservaForm.get('fecha')?.value;
    const hora = this.reservaForm.get('hora')?.value;

    if (!fecha || !hora) {
      this.mesasOcupadasIds.set(new Set());
      return;
    }

    const fechaISO = new Date(fecha).toISOString().split('T')[0];
    const fechaHoraISO = `${fechaISO}T${hora}:00`;
    
    // Convertimos input string a number
    const restIdNumber = Number(this.restauranteId()); 

    this.reservasService.getMesasOcupadas(restIdNumber, fechaHoraISO)
      .subscribe({
        next: (idsOcupados: number[]) => { // Solución error: Implicit any
          this.mesasOcupadasIds.set(new Set(idsOcupados));
          
          const seleccionadas = new Set(this.mesasSeleccionadas());
          
          // Solución error: Implicit any en el forEach
          idsOcupados.forEach((id: number) => { 
            if (seleccionadas.has(id)) {
              seleccionadas.delete(id);
            }
          });
          this.mesasSeleccionadas.set(seleccionadas);
        },
        error: () => console.error("Error verificando disponibilidad")
      });
  }

  toggleMesa(mesaId: number) {
    if (this.mesasOcupadasIds().has(mesaId)) return;

    const seleccionActual = new Set(this.mesasSeleccionadas());
    if (seleccionActual.has(mesaId)) seleccionActual.delete(mesaId);
    else seleccionActual.add(mesaId);
    
    this.mesasSeleccionadas.set(seleccionActual);
  }

  onConfirmarReserva() {
    const rawId = this.authService.getUsuarioIdFromToken();
    if (!rawId) {
      this.errorMessage.set('Debe iniciar sesión para reservar.');
      this.estado.set('error');
      return;
    }
    const usuarioId = Number(rawId);

    if (this.mesasSeleccionadas().size === 0) {
       alert("Por favor, selecciona una mesa en el mapa.");
       return;
    }

    this.estado.set('loading');
    
    const formValue = this.reservaForm.value;
    const fechaISO = new Date(formValue.fecha!).toISOString().split('T')[0];
    const fechaHoraISO = `${fechaISO}T${formValue.hora}:00`;
    const mesaIdsParaEnviar = Array.from(this.mesasSeleccionadas());

    // Aseguramos conversión de restauranteId a número
    const payload: CrearReservaPayload = { 
      usuarioId: usuarioId,
      restauranteId: Number(this.restauranteId()), // Solución error: string not assignable to number
      fechaHora: fechaHoraISO,
      cantidadPersonas: formValue.cantidadPersonas,
      tipo: 'NORMAL', 
      mesaIds: mesaIdsParaEnviar,
      observaciones: 'Reserva desde Web'
    };

    this.reservasService.crearReserva(payload).subscribe({
        next: () => {
          this.estado.set('confirmada');
          this.abrirPopUpExito();
        },
        error: (err) => {
          const mensajeError = err.error?.message || 'Error al reservar.';
          this.errorMessage.set(mensajeError);
          this.estado.set('error');
        }
      });
  }

  abrirPopUpExito() {
      const dialogRef = this.dialog.open(ReservaExitosaDialog, { width: '400px', disableClose: true });
      dialogRef.afterClosed().subscribe(() => this.router.navigate(['/home']));
  }

  resetForm() {
    this.estado.set('disponible');
    this.mesasSeleccionadas.set(new Set());
    this.errorMessage.set(null);
  }
}