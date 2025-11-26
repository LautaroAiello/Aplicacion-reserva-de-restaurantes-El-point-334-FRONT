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
  @Output() filtrosCambiados = new EventEmitter<{nombre: string, etiqueta: string}>();

  // Signals para el estado local
  etiquetas = signal<EtiquetaDTO[]>([]);
  tagSeleccionada = signal<string>(''); // Nombre de la etiqueta activa
  busquedaTexto = signal<string>('');

  ngOnInit() {
    this.cargarEtiquetas();
  }

  cargarEtiquetas() {
    this.restauranteService.getEtiquetas().subscribe({
      next: (data) => this.etiquetas.set(data),
      error: (err) => console.error('Error cargando etiquetas', err)
    });
  }

  // Se ejecuta al escribir en el input
  onSearchChange() {
    this.emitirFiltros();
  }

  // Se ejecuta al hacer click en una tarjeta del carrusel
  seleccionarTag(nombreTag: string) {
    if (this.tagSeleccionada() === nombreTag) {
      // Si ya estaba seleccionada, la quitamos (toggle off) para quitar el filtro
      this.tagSeleccionada.set('');
    } else {
      // Si no, la activamos
      this.tagSeleccionada.set(nombreTag);
    }
    // Emitimos el cambio para que el padre filtre
    this.emitirFiltros();
  }

  private emitirFiltros() {
    this.filtrosCambiados.emit({
      nombre: this.busquedaTexto(),
      etiqueta: this.tagSeleccionada()
    });
  }
}