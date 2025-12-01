import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 💡 Fundamental para [(ngModel)]
import { MatIconModule } from '@angular/material/icon';

// Tus modelos y servicios
import { RestauranteService } from '../../../core/services/restaurante.service';
import { EtiquetaDTO } from '../../../core/models/restaurante.model'; // Asegúrate de que esta ruta sea correcta

@Component({
  selector: 'app-buscador-con-filtro',
  standalone: true,
  // 💡 IMPORTS CORREGIDOS: Necesitamos FormsModule para el input y MatIconModule para los iconos
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule
  ], 
  templateUrl: './buscador-con-filtro.html',
  styleUrl: './buscador-con-filtro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorConFiltro implements OnInit {
  private restauranteService = inject(RestauranteService);

  // Emitimos el evento al padre para que él recargue la lista
  @Output() filtrosCambiados = new EventEmitter<{
      nombre: string, 
      etiqueta: string, 
      soloPopulares: boolean 
  }>();

  // Signals para el estado local
  etiquetas = signal<EtiquetaDTO[]>([]);
  tagSeleccionada = signal<string>(''); // Nombre de la etiqueta activa
  busquedaTexto = signal<string>('');
  filtroPopularesActivo = signal<boolean>(false);

  ngOnInit() {
    this.cargarEtiquetas();
  }

  togglePopulares() {
    const nuevoEstado = !this.filtroPopularesActivo();
    this.filtroPopularesActivo.set(nuevoEstado);

    // Si activamos populares, limpiamos los otros filtros para evitar mezclas raras
    if (nuevoEstado) {
      this.tagSeleccionada.set('');
      this.busquedaTexto.set('');
    }

    this.emitirFiltros();
  }

  cargarEtiquetas() {
    this.restauranteService.getEtiquetas().subscribe({
      next: (data) => this.etiquetas.set(data),
      error: (err) => console.error('Error cargando etiquetas', err)
    });
  }

  // Se ejecuta al escribir en el input
  onSearchChange() {
    if (this.busquedaTexto()) {
        this.filtroPopularesActivo.set(false);
    }
    this.emitirFiltros();
  }

  // Se ejecuta al hacer click en una tarjeta del carrusel
  seleccionarTag(nombreTag: string) {
    this.filtroPopularesActivo.set(false); // Desactivar populares
    
    // Lógica existente de toggle tag
    if (this.tagSeleccionada() === nombreTag) {
      this.tagSeleccionada.set('');
    } else {
      this.tagSeleccionada.set(nombreTag);
    }
    this.emitirFiltros();
  }

  private emitirFiltros() {
    this.filtrosCambiados.emit({
      nombre: this.busquedaTexto(),
      etiqueta: this.tagSeleccionada(),
      soloPopulares: this.filtroPopularesActivo()
    });
  }
}