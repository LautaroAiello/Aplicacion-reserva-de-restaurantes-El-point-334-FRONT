import {
  ChangeDetectionStrategy,
  Component,
  input,
  output, // Nuevo: Para emitir eventos al padre
  signal, // Nuevo: Para manejar estado interno
  inject, // Nuevo: Para inyectar servicios
  OnInit,
  InputSignal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'; // Nuevo: Para el botón flotante
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Nuevo: Para navegar
import { DireccionDTO } from '../../../../../core/models/restaurante.model'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-restaurante-card',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatChipsModule, 
    MatButtonModule // Importante agregarlo aquí
  ],
  templateUrl: './restaurante-card.html',
  styleUrl: './restaurante-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestauranteCard implements OnInit {
  
  // --- DEPENDENCIAS ---
  private router = inject(Router);

  // --- INPUTS ---
  public id: InputSignal<string | number> = input.required();
  public nombreRestaurante: InputSignal<string> = input.required();
  public direccion: InputSignal<DireccionDTO | undefined> = input<DireccionDTO>();
  public horarioApertura: InputSignal<string> = input('');
  public horarioCierre: InputSignal<string> = input('');
  public imagenUrl = input<string | undefined>();
  
  // Nuevo: Recibe si el restaurante ya es favorito del usuario (Opcional, por defecto false)
  public esFavoritoInicial = input<boolean>(false);

  // --- OUTPUTS ---
  // Emitimos el ID al componente padre cuando dan like
  public toggleFavorito = output<string | number>();

  // --- ESTADO INTERNO ---
  // Usamos un signal para cambiar el icono visualmente al instante (UI Optimista)
  protected isFavorite = signal(false);

  constructor() {
    // console.log(this.imagenUrl()); // Debug opcional
  }

  ngOnInit() {
    // Sincronizamos el estado inicial con lo que manda el padre
    this.isFavorite.set(this.esFavoritoInicial());
  }

  // --- MÉTODOS DE INTERACCIÓN ---

  onFavoriteClick() {
    // 1. Cambiamos el icono visualmente de inmediato
    this.isFavorite.update((valorActual) => !valorActual);
    
    // 2. Avisamos al padre para que llame al Backend
    this.toggleFavorito.emit(this.id());
  }

  navegarAlDetalle() {
    // Navegamos a la ruta de detalle.
    // Asegúrate de que tu ruta en app.routes.ts sea 'restaurante/:id'
    this.router.navigate(['/restaurante', this.id()]);
  }
}