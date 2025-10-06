import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
  @Input() nombreRestaurante: string = '';
  @Input() imagenRestaurante: string = '';
  @Input() arrayEtiquetas: string[] = [];
  @Input() calificacion: number = 0;
  @Input() direccion: string = '';
  @Input() distancia: string = '';

  constructor() {
    this.imagenRestaurante =
      'https://fastly.picsum.photos/id/695/200/300.jpg?hmac=8XcLTGOEhNglzXNZlLLbH0z6flQivZ2F6LML0Wah8lI';
    this.nombreRestaurante = 'La Trattoria';
    this.arrayEtiquetas = ['Italiana', 'Pizza', 'Pasta'];
    this.direccion = 'San jeronimo 123, Ciudad';
  }
}
