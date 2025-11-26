import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal, // 1. Importar signal
} from '@angular/core';
import { RestauranteCard } from './components/restaurante-card/restaurante-card';
import { BuscadorConFiltro } from '../../components/buscador-con-filtro/buscador-con-filtro';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { CommonModule } from '@angular/common';
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

  // 2. DEFINICIÓN DE SIGNALS
  // Cambiamos Observable por signal para poder usar .set()
  public restaurantes = signal<RestauranteDTO[]>([]);
  public loading = signal<boolean>(true); // Inicializamos en true para la carga inicial

  ngOnInit() {
    this.cargarRestaurantesIniciales();
  }

  cargarRestaurantesIniciales() {
    this.loading.set(true);
    // Nos suscribimos manualmente para pasar el valor al Signal
    this.restauranteService.getListarRestaurantes().subscribe({
      next: (data) => {
        this.restaurantes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando restaurantes', err);
        this.loading.set(false);
      }
    });
  }

  filtrarRestaurantes(filtros: { nombre: string; etiqueta: string }) {
    this.loading.set(true);

    // Llamamos al endpoint de búsqueda
    this.restauranteService.buscarRestaurantes(filtros.nombre, filtros.etiqueta)
      .subscribe({
        next: (data) => {
          this.restaurantes.set(data); // Ahora sí funciona el .set()
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error filtrando', err);
          this.loading.set(false);
        },
      });
  }
}