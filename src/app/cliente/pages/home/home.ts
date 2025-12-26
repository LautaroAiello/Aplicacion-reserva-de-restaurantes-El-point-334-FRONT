import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SimpleCard } from '../../components/simple-card/simple-card';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { RestauranteDTO } from '../../../core/models/restaurante.model';
import { ReservasService } from '../../../core/services/reservas.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cliente-home-page',
  standalone: true,
  imports: [CommonModule, SimpleCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteHomePage implements OnInit {
  private restauranteService = inject(RestauranteService);
  private reservasService = inject(ReservasService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // 1. Novedades (Últimos creados)
  protected novedades$!: Observable<RestauranteDTO[]>;
  // 2. Historial
  protected reservarNuevo$!: Observable<RestauranteDTO[]>;
  // 3. Populares (Más reservas)
  protected masPopulares$!: Observable<RestauranteDTO[]>;

  ngOnInit() {
    // 1. NOVEDADES: Ordenamos por ID descendente (el ID más alto es el más nuevo)
    this.novedades$ = this.restauranteService.getRestaurantes().pipe(
      map(restaurantes => 
        restaurantes
          .sort((a, b) => Number(b.id) - Number(a.id)) // Mayor ID primero
          .slice(0, 5) // Solo los 5 últimos
      )
    );

    // 2. MÁS POPULARES: Ordenamos por cantidadReservas descendente
    this.masPopulares$ = this.restauranteService.getRestaurantes().pipe(
      map(restaurantes => 
        restaurantes
          // Usamos || 0 por si viene null del backend
          .sort((a, b) => (b.cantidadReservas || 0) - (a.cantidadReservas || 0)) 
          .slice(0, 5) // Top 5
      )
    );

    // 3. RESERVAR DE NUEVO: (Lógica original intacta)
    this.reservarNuevo$ = this.reservasService.getMisReservas().pipe(
      switchMap((reservas) => {
        if (!reservas || reservas.length === 0) return of([]);

        // Ordenar por fecha (más reciente primero)
        reservas.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

        // Extraer IDs únicos de restaurantes (limitado a 5)
        const idsUnicos = [...new Set(reservas.map((r) => r.restauranteId))].slice(0, 5);

        // Obtener detalles de cada restaurante en paralelo
        const peticiones = idsUnicos.map((id) => 
          this.restauranteService.getRestaurantePorId(id.toString())
        );

        return forkJoin(peticiones);
      }),
      catchError(() => of([]))
    );
  }

  public cardClicked(id: number | string): void {
    this.router.navigate(['/restaurante', id]);
  }
}