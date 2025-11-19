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
  mesasReservadas: { mesaId: number }[];
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