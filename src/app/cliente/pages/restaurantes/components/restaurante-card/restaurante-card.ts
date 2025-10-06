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
  protected nombreRestaurante: InputSignal<string> = input.required();
  protected imagenRestaurante: InputSignal<string> = input.required();
  protected etiquetas: InputSignal<string[]> = input<string[]>([]);
  protected calificacion: InputSignal<number> = input.required();
  protected direccion: InputSignal<string> = input.required();
  protected distancia: InputSignal<string> = input.required();

  constructor() {

  }
}
