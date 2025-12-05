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
  usuarioId: number;
  restauranteId: number;
  fechaHora: string; // Formato ISO
  cantidadPersonas: number;
  tipo: string; // 'MANUAL' | 'NORMAL'
  
  emailCliente?: string;
  nombreClienteManual?: string;
  observaciones?: string;

  mesaIds: number[];  
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

export interface ReservaAdminDTO {
  id: number;
  fechaHora: string;
  cantidadPersonas: number;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA';
  observaciones: string;
  tipo: string;
  usuarioId: number;
  nombreCliente: string;
  apellidoCliente: string;
  mesasIds: number[];
}