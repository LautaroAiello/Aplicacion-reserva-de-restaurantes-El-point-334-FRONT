import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RestauranteCard } from "./components/restaurante-card/restaurante-card";

@Component({
  selector: 'app-cliente-restaurantes-page',
  imports: [RestauranteCard],
  templateUrl: './restaurantes.html',
  styleUrl: './restaurantes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteRestaurantesPage {}
