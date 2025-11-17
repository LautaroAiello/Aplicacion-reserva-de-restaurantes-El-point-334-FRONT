import {
  ChangeDetectionStrategy,
  Component,
  input,
  InputSignal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { DireccionDTO } from '../../../../../core/services/restaurante.service'; // Importar DTO

@Component({
  selector: 'app-restaurante-card',
  standalone: true, // Asegúrate de que sea standalone
  imports: [CommonModule, MatIconModule, MatChipsModule], // Añadir CommonModule
  templateUrl: './restaurante-card.html',
  styleUrl: './restaurante-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestauranteCard {
  // --- INPUTS ANTIGUOS (QUE YA NO EXISTEN) ---
  // public etiquetas: InputSignal<string[]> = input<string[]>([]);
  // public calificacion: InputSignal<number> = input.required();
  // public distancia: InputSignal<string> = input.required();

  // --- INPUTS NUEVOS (Basados en RestauranteDTO) ---
  public id: InputSignal<string | number> = input.required();
  public nombreRestaurante: InputSignal<string> = input.required();
  public direccion: InputSignal<DireccionDTO | undefined> =
    input<DireccionDTO>();
  public horarioApertura: InputSignal<string> = input('');
  public horarioCierre: InputSignal<string> = input('');
}
