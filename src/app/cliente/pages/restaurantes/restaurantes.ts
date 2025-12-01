import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RestauranteCard } from './components/restaurante-card/restaurante-card';
import { BuscadorConFiltro } from '../../components/buscador-con-filtro/buscador-con-filtro';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';
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
  private authService = inject(AuthService);

  public restaurantes = signal<RestauranteDTO[]>([]);
  public loading = signal<boolean>(true);

  ngOnInit() {
    this.cargarRestaurantesIniciales();
  }

  cargarRestaurantesIniciales() {
    this.loading.set(true);
    
    // 1. OBTENER ID RAW (String o Null)
    const rawId = this.authService.getUsuarioIdFromToken(); 

    // 2. CONVERTIR A NUMBER (Solución al error 1)
    // Si rawId existe, lo convertimos a número. Si no, mandamos undefined.
    const usuarioId = rawId ? Number(rawId) : undefined;

    this.restauranteService.getRestaurantes(usuarioId).subscribe({
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

  filtrarRestaurantes(filtros: { nombre: string; etiqueta: string; soloPopulares: boolean }) {
    this.loading.set(true);

    // Obtenemos ID de usuario (para pintar los corazones correctamente en cualquier lista)
    const rawId = this.authService.getUsuarioIdFromToken();
    const usuarioId = rawId ? Number(rawId) : undefined;

    // 💡 LÓGICA DE DECISIÓN
    if (filtros.soloPopulares) {
      // LLAMADA AL RANKING GLOBAL
      console.log("Cargando Top 10 Populares...");
      
      // Asegúrate de tener este método en tu RestauranteService
      this.restauranteService.getPopulares(usuarioId).subscribe({
        next: (data) => {
          this.restaurantes.set(data);
          this.loading.set(false);
        },
        error: (err) => {
            console.error(err);
            this.loading.set(false);
        }
      });

    } else {
      // BÚSQUEDA NORMAL
      this.restauranteService.buscarRestaurantes(filtros.nombre, filtros.etiqueta) // Nota: buscarRestaurantes debería aceptar usuarioId si quieres corazones ahí también
        .subscribe({
          next: (data) => {
            this.restaurantes.set(data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
    }
  }

  onToggleFavorito(restauranteId: string | number) {
    const rawId = this.authService.getUsuarioIdFromToken();
    
    if (!rawId) {
      alert("Debes iniciar sesión para guardar favoritos.");
      return;
    }

    // Convertir a número aquí también
    const usuarioId = Number(rawId);

    this.restauranteService.toggleFavorito(+restauranteId, usuarioId).subscribe({
      next: (esFavorito) => {
        console.log(`Favorito actualizado: ${esFavorito}`);
      },
      error: (err) => console.error('Error al guardar favorito', err)
    });
  }
}