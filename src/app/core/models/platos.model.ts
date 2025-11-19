export interface CategoriaPlatoDTO {
  id: number;
  nombre: string;
}

export interface EtiquetaDTO {
  id: number;
  nombre: string;
}

// DTO para la entidad Plato (lo que recibimos)
export interface PlatoDTO {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  estado: string; // Ej: "DISPONIBLE", "AGOTADO"
  imagenUrl: string;
  categoriaPlato: CategoriaPlatoDTO;
}

// DTO para CREAR un Plato (lo que enviamos)
// El backend espera la entidad Plato, así que debemos anidar la categoría
export interface PlatoCreateDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  estado: string;
  imagenUrl: string;
  // Enviamos solo el ID de la categoría,
  // el backend debería resolverlo.
  // (Si el backend espera el objeto completo, ajustamos esto)
  categoriaPlato: { id: number };
  // Asumo que las etiquetas se asignan en otro endpoint (PlatoEtiquetaController)
}