import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  InputSignal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, switchMap } from 'rxjs';
import {
  RestauranteService,
} from '../../../core/services/restaurante.service';
import { FormularioReserva } from '../../components/formulario-reserva/formulario-reserva';

// Importa los módulos de Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DireccionDTO, RestauranteDTO } from '../../../core/models/restaurante.model';

@Component({
  selector: 'app-cliente-restaurante-page',
  standalone: true, // <-- Es standalone
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormularioReserva,
  ],
  templateUrl: './restaurante.html',
  styleUrl: './restaurante.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteRestaurantePage implements OnInit {
  private route = inject(ActivatedRoute);
  private restauranteService = inject(RestauranteService);

  public restaurante$!: Observable<RestauranteDTO>;
  public direccion: InputSignal<DireccionDTO | undefined> = input<DireccionDTO>();
  
  ngOnInit() {
    this.restaurante$ = this.route.params.pipe(
      switchMap((params) => {
        const id = params['id'];
        return this.restauranteService.getRestaurantePorId(id);
      })
    );
  }
}
