import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RestauranteCard } from './components/restaurante-card/restaurante-card';
import { BuscadorConFiltro } from '../../components/buscador-con-filtro/buscador-con-filtro';
import {
  RestauranteService
} from '../../../core/services/restaurante.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common'; // <-- Necesario para | async
import { RestauranteDTO } from '../../../core/models/restaurante.model';

@Component({
  selector: 'app-cliente-restaurantes-page',
  standalone: true,
  imports: [RestauranteCard, BuscadorConFiltro, CommonModule],
  templateUrl: './restaurantes.html',
  styleUrl: './restaurantes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteRestaurantesPage implements OnInit {
  private restauranteService = inject(RestauranteService);

  public restaurantes$!: Observable<RestauranteDTO[]>;

  ngOnInit() {
    this.restaurantes$ = this.restauranteService.getListarRestaurantes();
  }

  // protected restaurantesMock = [
  //   {
  //     nombreRestaurante: 'Restaurante 1',
  //     imagenRestaurante: 'https://picsum.photos/400/300',
  //     etiquetas: ['italiana', 'pasta'],
  //     calificacion: 4.5,
  //     direccion: 'Calle 1',
  //     distancia: '1 km',
  //   },
  //   {
  //     nombreRestaurante: 'Restaurante 2',
  //     imagenRestaurante: 'https://picsum.photos/400/300',
  //     etiquetas: ['mexicana', 'tacos'],
  //     calificacion: 4.0,
  //     direccion: 'Calle 2',
  //     distancia: '2 km',
  //   },
  //   {
  //     nombreRestaurante: 'Restaurante 3',
  //     imagenRestaurante: 'https://picsum.photos/400/300',
  //     etiquetas: ['japonesa', 'sushi'],
  //     calificacion: 5.0,
  //     direccion: 'Calle 3',
  //     distancia: '3 km',
  //   },
  // ];
}
