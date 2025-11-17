import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, switchMap, of } from 'rxjs';

// --- Interfaces (DTOs) para Reservas ---

// Payload para consultar disponibilidad
export interface DisponibilidadPayload {
  restauranteId: string;
  fechaHora: string; // ISO: 2025-11-10T20:00:00
  cantidadPersonas: number;
}
// Respuesta de la API de disponibilidad (Ejemplo)
export interface DisponibilidadResponse {
  available: boolean;
}

// Payload para crear la reserva (según tu resumen)
export interface CrearReservaPayload {
  usuarioId: string;
  restauranteId: string;
  fechaHora: string; // "YYYY-MM-DDTHH:MM:SS"
  cantidadPersonas: number;
  tipo: string; // Ej: "NORMAL"
  observaciones?: string; // Opcional
  mesasReservadas: { mesaId: string }[];
}
export interface MisReservasResponse {
  id: string; // ID de la reserva
  restauranteId: string;
  restauranteNombre: string;
  restauranteImagenUrl: string; // Para mostrar una foto
  fechaHora: string; // La fecha ISO (YYYY-MM-DDTHH:MM:SS)
  cantidadPersonas: number;
  estado: string; // Ej: "CONFIRMADA", "CANCELADA"
}

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
