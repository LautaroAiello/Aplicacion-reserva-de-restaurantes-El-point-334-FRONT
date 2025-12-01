import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { AuthService } from '../../../core/services/auth.service';
import { RestauranteDTO } from '../../../core/models/restaurante.model';
import { RestauranteCard } from '../restaurantes/components/restaurante-card/restaurante-card';

@Component({
  selector: 'app-cliente-favoritos',
  standalone: true,
  imports: [CommonModule, RestauranteCard],
  template: `
    <div class="container">
      <h1>Mis Favoritos ❤️</h1>

      @if (loading()) {
        <p>Cargando favoritos...</p>
      } @else if (favoritos().length === 0) {
        <div class="empty-state">
          <p>Aún no tienes favoritos guardados.</p>
        </div>
      } @else {
        <div class="grid">
          @for (rest of favoritos(); track rest.id) {
            <app-restaurante-card
              [id]="rest.id"
              [nombreRestaurante]="rest.nombre"
              [imagenUrl]="rest.imagenUrl"
              [direccion]="rest.direccion"
              [horarioApertura]="rest.horarioApertura"
              [horarioCierre]="rest.horarioCierre"
              
              [esFavoritoInicial]="true" 
              (toggleFavorito)="quitarFavorito($event)"
            >
            </app-restaurante-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .empty-state { text-align: center; margin-top: 50px; color: #666; font-size: 1.2rem; }
  `]
})
export class ClienteFavoritosPage implements OnInit {
  private restauranteService = inject(RestauranteService);
  private authService = inject(AuthService);

  favoritos = signal<RestauranteDTO[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.cargarFavoritos();
  }

  cargarFavoritos() {
    // 1. Obtener ID crudo (string | null)
    const rawId = this.authService.getUsuarioIdFromToken();
    
    // 2. Validar y Convertir
    if (rawId) {
      const usuarioId = Number(rawId); // 💡 Conversión explícita

      this.restauranteService.getMisFavoritos(usuarioId).subscribe({
        next: (data) => {
          this.favoritos.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error("Error cargando favoritos", err);
          this.loading.set(false);
        }
      });
    } else {
      // Si no hay usuario, no cargamos nada
      this.loading.set(false);
    }
  }

  // 💡 LÓGICA DE QUITAR: Si lo desmarca aquí, debe desaparecer de la lista
  quitarFavorito(restauranteId: string | number) {
    const rawId = this.authService.getUsuarioIdFromToken();
    
    if (!rawId) return;

    // 1. Convertimos IDs a número para el servicio
    const usuarioId = Number(rawId); 
    const idRestauranteNumerico = Number(restauranteId);

    this.restauranteService.toggleFavorito(idRestauranteNumerico, usuarioId).subscribe(() => {
      
      // 2. SOLUCIÓN DEL ERROR:
      // Convertimos también el r.id a Number() para asegurar que comparamos Numero con Numero
      this.favoritos.update(lista => 
        lista.filter(r => Number(r.id) !== idRestauranteNumerico)
      );
      
    });
  }
}