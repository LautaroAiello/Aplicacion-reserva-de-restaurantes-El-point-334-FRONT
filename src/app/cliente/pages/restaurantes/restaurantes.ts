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
export class ClienteRestaurantesPage {}
