import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  InputSignal,
  OnInit,
  signal, // 💡 Usaremos Signals
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { switchMap } from 'rxjs';
import { RestauranteService } from '../../../core/services/restaurante.service';
import { FormularioReserva } from '../../components/formulario-reserva/formulario-reserva'; 
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; 
// Importa los módulos de Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // 💡 Importar Dialog Service
import { DireccionDTO, RestauranteDTO } from '../../../core/models/restaurante.model';
import { MenuDialogComponent } from '../../components/menu-dialog/menu-dialog';

@Component({
  selector: 'app-cliente-restaurante-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule, // 💡 Necesario para el servicio
    FormularioReserva,
    // No hace falta importar MenuDialogComponent aquí si se abre dinámicamente, 
    // pero es buena práctica tenerlo disponible o importarlo si lo usaras en el template.
  ],
  templateUrl: './restaurante.html',
  styleUrl: './restaurante.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteRestaurantePage implements OnInit {
  private route = inject(ActivatedRoute);
  private restauranteService = inject(RestauranteService);
  private dialog = inject(MatDialog); // 💡 Inyectamos el servicio de diálogo
  private sanitizer = inject(DomSanitizer);
  // Cambiamos Observable por Signal para facilitar el acceso a los datos
  public restaurante = signal<RestauranteDTO | null>(null);
  public loading = signal<boolean>(true);
  public mapaUrl = signal<SafeResourceUrl | null>(null);
  public direccion: InputSignal<DireccionDTO | undefined> = input<DireccionDTO>();
  
  ngOnInit() {
    this.route.params.pipe(
      switchMap((params) => {
        const id = params['id'];
        return this.restauranteService.getRestaurantePorId(id);
      })
    ).subscribe({
      next: (data) => {
        this.restaurante.set(data);
        // <--- 3. GENERAR URL DEL MAPA SI HAY COORDENADAS --->
        if (data.direccion && data.direccion.latitud && data.direccion.longitud) {
          const url = this.generarUrlOpenStreetMap(data.direccion.latitud, data.direccion.longitud);
          this.mapaUrl.set(url);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando restaurante', err);
        this.loading.set(false);
      }
    });
  }

  // 💡 Lógica para abrir el menú
  abrirMenu() {
    const rest = this.restaurante(); // Obtenemos el valor actual del signal
    
    if (!rest) return;

    this.dialog.open(MenuDialogComponent, {
      width: '600px',
      maxHeight: '85vh',
      autoFocus: false, // Evita que se enfoque el primer botón automáticamente
      data: {
        nombreRestaurante: rest.nombre,
        menu: rest.menu,
        // Verificamos la configuración. Si es null, asumimos true por defecto.
        mostrarPrecios: rest.configuracion?.mostrarPrecios ?? true 
      }
    });
  }

   private generarUrlOpenStreetMap(lat: number | string, lon: number | string): SafeResourceUrl {
    const latNum = Number(lat);
    const lonNum = Number(lon);
    const offset = 0.002; // Ajusta el zoom (mientras más chico, más zoom)

    // Bounding Box: minLon, minLat, maxLon, maxLat
    const bbox = `${lonNum - offset},${latNum - offset},${lonNum + offset},${latNum + offset}`;
    
    // URL de Embed de OSM
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latNum},${lonNum}`;
    
    // Le decimos a Angular que confiamos en esta URL
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}