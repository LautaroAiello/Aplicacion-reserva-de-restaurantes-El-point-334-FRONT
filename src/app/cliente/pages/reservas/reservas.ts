import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ReservasService,
} from '../../../core/services/reservas.service';
import { ReservaCard } from '../../components/reserva-card/reserva-card'; // <-- Importar
import { MisReservasResponse } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-cliente-reservas-page',
  standalone: true, // <-- Asegurarse que sea standalone
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReservaCard, // <-- Añadir
  ],
  templateUrl: './reservas.html',
  styleUrl: './reservas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteReservasPage implements OnInit {
  private reservasService = inject(ReservasService);

  public misReservas$!: Observable<MisReservasResponse[]>;

  ngOnInit() {
    this.misReservas$ = this.reservasService.getMisReservas();
  }
}
