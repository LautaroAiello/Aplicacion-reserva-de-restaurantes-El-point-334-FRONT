import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SimpleCard } from '../../components/simple-card/simple-card';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
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

  protected mejoresPrecios$!: Observable<RestauranteDTO[]>;
  protected reservarNuevo$!: Observable<RestauranteDTO[]>;
  protected mejoresPuntuados$!: Observable<RestauranteDTO[]>;

  ngOnInit() {
    // 1. MEJORES PRECIOS: Tomamos los primeros 10 de la lista general
    // (Idealmente el backend debería tener un endpoint /restaurantes?sort=precio)
    this.mejoresPrecios$ = this.restauranteService.getRestaurantes().pipe(
      map(restaurantes => restaurantes.slice(0, 5))
    );

    // 2. MEJORES PUNTUADOS: Usamos el nuevo endpoint getPopulares
    const userIdStr = this.authService.getUsuarioIdFromToken();
    const userId = userIdStr ? Number(userIdStr) : undefined;
    
    this.mejoresPuntuados$ = this.restauranteService.getPopulares(userId);

    // 3. RESERVAR DE NUEVO: Historial de reservas del usuario
    this.reservarNuevo$ = this.reservasService.getMisReservas().pipe(
      switchMap((reservas) => {
        if (!reservas || reservas.length === 0) {
          return of([]);
        }

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
      catchError(() => of([])) // Si falla (ej. no logueado), retorna lista vacía
    );
  }

  public cardClicked(id: number | string): void {
    this.router.navigate(['/restaurante', id]);
  }
}