import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RestauranteCard } from './components/restaurante-card/restaurante-card';
import { BuscadorConFiltro } from '../../components/buscador-con-filtro/buscador-con-filtro';

@Component({
  selector: 'app-cliente-restaurantes-page',
  imports: [RestauranteCard, BuscadorConFiltro],
  templateUrl: './restaurantes.html',
  styleUrl: './restaurantes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteRestaurantesPage {
  protected restaurantesMock = [
    {
      nombreRestaurante: 'Restaurante 1',
      imagenRestaurante: 'https://picsum.photos/400/300',
      etiquetas: ['italiana', 'pasta'],
      calificacion: 4.5,
      direccion: 'Calle 1',
      distancia: '1 km',
    },
    {
      nombreRestaurante: 'Restaurante 2',
      imagenRestaurante: 'https://picsum.photos/400/300',
      etiquetas: ['mexicana', 'tacos'],
      calificacion: 4.0,
      direccion: 'Calle 2',
      distancia: '2 km',
    },
    {
      nombreRestaurante: 'Restaurante 3',
      imagenRestaurante: 'https://picsum.photos/400/300',
      etiquetas: ['japonesa', 'sushi'],
      calificacion: 5.0,
      direccion: 'Calle 3',
      distancia: '3 km',
    },
  ];
}
