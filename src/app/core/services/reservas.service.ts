import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, switchMap, of } from 'rxjs';
import { CrearReservaPayload, DisponibilidadPayload, DisponibilidadResponse, MisReservasResponse, ReservaAdminDTO } from '../models/reserva.model';



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

  // Obtener reservas de un restaurante
  getReservasPorRestaurante(restauranteId: string): Observable<ReservaAdminDTO[]> {
    return this.http.get<ReservaAdminDTO[]>(
      `${this.apiUrl}/api/reserva/reservas/restaurante/${restauranteId}`
    );
  }
  // Actualizar estado (Aceptar/Rechazar)
  // Asumimos que el backend tiene un PUT genérico o un PATCH para estado
  // Si no tienes uno específico, usamos el actualizarReserva que ya tenías
  actualizarEstadoReserva(id: number, nuevoEstado: string): Observable<any> {
    // Enviamos solo el estado (o el objeto parcial según tu backend soporte)
    // Ajusta esto según tu controller de actualización
    return this.http.put(`${this.apiUrl}/api/reserva/reservas/${id}`, { estado: nuevoEstado });
  }

  // (Aquí también podrías tener 'cancelarReserva()', etc.)
}
