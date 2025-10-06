import { ChangeDetectionStrategy, Component, input, Input, InputSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-restaurante-card',
  imports: [MatIconModule, MatChipsModule],
  templateUrl: './restaurante-card.html',
  styleUrl: './restaurante-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestauranteCard {
   nombreRestaurante: InputSignal<string> = input.required();
   imagenRestaurante: InputSignal<string> = input.required();
   etiquetas: InputSignal<string[]> = input<string[]>([]);
   calificacion: InputSignal<number> = input.required();
   direccion: InputSignal<string> = input.required();
   distancia: InputSignal<string> = input.required();

  constructor() {

  }
}
