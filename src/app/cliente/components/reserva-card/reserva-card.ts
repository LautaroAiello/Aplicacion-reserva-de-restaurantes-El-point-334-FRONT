import {
  ChangeDetectionStrategy,
  Component,
  input,
  InputSignal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // <-- Importar DatePipe
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reserva-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    DatePipe, // <-- Añadir DatePipe a imports
  ],
  templateUrl: './reserva-card.html',
  styleUrl: './reserva-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe], // <-- Proveer DatePipe
})
export class ReservaCard {
  // Usamos 'input' (la API moderna) para recibir los datos
  reserva: InputSignal<any> = input.required<any>();

  // (Opcional) Aquí podrías añadir un @Output para el botón 'cancelar'
  // @Output() cancelar = new EventEmitter<string>();

  // onCancelar() {
  //   this.cancelar.emit(this.reserva().id);
  // }
}
