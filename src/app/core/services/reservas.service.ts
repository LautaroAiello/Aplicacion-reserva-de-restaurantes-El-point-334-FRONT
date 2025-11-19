import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, switchMap, of } from 'rxjs';
import { CrearReservaPayload, DisponibilidadPayload, DisponibilidadResponse, MisReservasResponse } from '../models/reserva.model';



@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  // Endpoint: GET /reservas/disponibilidad (Ajusta la URL si es necesario)
  // Usamos HttpParams para enviar los datos como query params
  consultarDisponibilidad(
    payload: DisponibilidadPayload
  ): Observable<DisponibilidadResponse> {
    const params = new HttpParams()
      .set('restauranteId', payload.restauranteId)
      .set('fechaHora', payload.fechaHora)
      .set('cantidadPersonas', payload.cantidadPersonas.toString());

    return this.http.get<DisponibilidadResponse>(
      `${this.apiUrl}/api/reserva/reservas/disponibilidad`,
      { params }
    );
  }

  // Endpoint: POST /reservas/reservas (Tu orquestación)
  crearReserva(payload: CrearReservaPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/reserva/reservas`, payload);
  }

  // --- NUEVO: OBTENER MIS RESERVAS ---
  // (El interceptor se encarga del token)
  getMisReservas(): Observable<MisReservasResponse[]> {
    return this.http.get<MisReservasResponse[]>(
      `${this.apiUrl}/api/reserva/reservas/mias`
    );
  }

  // (Aquí también podrías tener 'cancelarReserva()', etc.)
}
