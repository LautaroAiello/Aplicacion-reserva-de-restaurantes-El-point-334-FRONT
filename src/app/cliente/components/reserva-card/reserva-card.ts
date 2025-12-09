import {
  ChangeDetectionStrategy,
  Component,
  input,
  output, // 💡 Nuevo: Para emitir eventos con Signals
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips'; // Opcional: para que el estado se vea mejor
import { MisReservasResponse } from '../../../core/models/reserva.model'; // Ajusta la ruta a tu modelo

@Component({
  selector: 'app-reserva-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule, 
    DatePipe,
  ],
  templateUrl: './reserva-card.html',
  styleUrl: './reserva-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // providers: [DatePipe] -> No es necesario en providers si solo se usa en el HTML
})
export class ReservaCard {
  // 1. Tipamos el input con la interfaz correcta
  reserva = input.required<MisReservasResponse>();

  // 2. Output moderno para avisar al padre
  cancelar = output<string>();

  // 3. Método gatillo
  onCancelar() {
    // Emitimos el ID (string)
    this.cancelar.emit(this.reserva().id);
  }
}