// --- NUEVAS INTERFACES PARA MESAS ---

// DTO para la entidad Mesa (basado en tu metadata)
export interface MesaDTO {
  id: number;
  descripcion: string;
  capacidad: number;
  // posicionX: number;
  // posicionY: number;
  bloqueada: boolean;
  // restauranteId no es necesario aquí, ya que la API la infiere de la URL
}

// DTO para CREAR una Mesa (el POST espera la entidad, omitimos el ID)
export interface MesaCreateDTO {
  descripcion: string;
  capacidad: number;
  // posicionX: number;
  // posicionY: number;
  bloqueada: boolean;
}
