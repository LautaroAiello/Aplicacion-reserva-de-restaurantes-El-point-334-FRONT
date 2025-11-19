import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { SimpleCard } from '../../components/simple-card/simple-card';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import {
  RestauranteService
} from '../../../core/services/restaurante.service';
import { RestauranteDTO } from '../../../core/models/restaurante.model';

@Component({
  selector: 'app-cliente-home-page',
  standalone: true,
  imports: [CommonModule, SimpleCard], // <-- Añadir CommonModule
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteHomePage implements OnInit {
  private restauranteService = inject(RestauranteService);
  private router = inject(Router);

  // Observables para las diferentes secciones
  // Por ahora, todos llaman al mismo endpoint.
  // Idealmente, tu API tendría endpoints como /restaurantes/populares
  protected populares$!: Observable<RestauranteDTO[]>;
  protected reservarNuevo$!: Observable<RestauranteDTO[]>;
  protected mejoresPuntuados$!: Observable<RestauranteDTO[]>;

  // Quita el 'protected mockCards = [...]'

  ngOnInit() {
    this.populares$ = this.restauranteService.getListarRestaurantes();
    this.reservarNuevo$ = this.restauranteService.getListarRestaurantes(); // Ajustar si tienes otro endpoint
    this.mejoresPuntuados$ = this.restauranteService.getListarRestaurantes(); // Ajustar si tienes otro endpoint
  }

  // Navega al detalle del restaurante
  public cardClicked(id: number | string): void {
    this.router.navigate(['/restaurante', id]);
  }
}

// import { ChangeDetectionStrategy, Component } from '@angular/core';
// import { SimpleCard } from '../../components/simple-card/simple-card';

// @Component({
//   selector: 'app-cliente-home-page',
//   imports: [SimpleCard],
//   templateUrl: './home.html',
//   styleUrl: './home.scss',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class ClienteHomePage {
//   protected mockCards = [
//     {
//       id: 1,
//       imgUrl: 'https://picsum.photos/200/300',
//       title: 'Card 1',
//     },
//     {
//       id: 2,
//       imgUrl: 'https://picsum.photos/200/300',
//       title: 'Card 2',
//     },
//     {
//       id: 3,
//       imgUrl: 'https://picsum.photos/200/300',
//       title: 'Card 3',
//     },
//   ];

//   public cardClicked(id: number):void  {
//     console.log('Card clicked', id);
//   }
// }
