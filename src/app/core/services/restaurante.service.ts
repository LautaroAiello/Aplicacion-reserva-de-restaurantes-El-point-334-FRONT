import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface DireccionDTO {
  calle: string;
  numero: string;
  ciudad: string;
  provincia: string;
  pais: string;
  latitud?: number;
  longitud?: number;
}

export interface RestauranteDTO {
  id: string; // o number
  nombre: string;
  telefono: string;
  horarioApertura: string;
  horarioCierre: string;
  activo: boolean;
  direccion: DireccionDTO; // <-- Es un objeto
  imagenUrl: string;
}
// DTO para la SAGA 2 (Asignar Gestor)
// (basado en el DTO de restaurant-service y la SAGA)
export interface GestorCreationDTO {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
}
// Define tu DTO complejo
export interface RegistroRestauranteDTO {
  // Datos del Restaurante
  nombre: string;
  telefono: string;
  horarioApertura: string; // "HH:mm:ss"
  horarioCierre: string; // "HH:mm:ss"

  // Objeto de Dirección (anidado)
  direccion: {
    calle: string;
    numero: string;
    ciudad: string;
    provincia: string;
    pais: string;
    latitud?: number;
    longitud?: number;
  };

  // Datos del Admin (planos)
  nombreUsuario: string;
  apellidoUsuario: string;
  emailUsuario: string;
  passwordUsuario: string;
  telefonoUsuario: string;
}

// NUEVA INTERFAZ: DTO para el PUT (actualizar)
// (Basado en los campos editables del RestauranteDTO)
export interface RestauranteUpdateDTO {
  nombre: string;
  telefono: string;
  horarioApertura: string; // "HH:mm:ss"
  horarioCierre: string; // "HH:mm:ss"
  direccion: DireccionDTO;
  // (Asumimos que 'activo' y 'entidad_fiscal_id' se manejan por separado)
}

// --- NUEVAS INTERFACES PARA MESAS ---

// DTO para la entidad Mesa (basado en tu metadata)
export interface MesaDTO {
  id: number;
  descripcion: string;
  capacidad: number;
  posicionX: number;
  posicionY: number;
  bloqueada: boolean;
  // restauranteId no es necesario aquí, ya que la API la infiere de la URL
}

// DTO para CREAR una Mesa (el POST espera la entidad, omitimos el ID)
export interface MesaCreateDTO {
  descripcion: string;
  capacidad: number;
  posicionX: number;
  posicionY: number;
  bloqueada: boolean;
}

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

@Injectable({
  providedIn: 'root',
})
export class RestauranteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // SAGA (POST /catalogo/restaurantes)
  registrarRestaurante(payload: RegistroRestauranteDTO): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/restaurant/restaurantes`,
      payload
    );
  }

  getListarRestaurantes(): Observable<RestauranteDTO[]> {
    return this.http.get<RestauranteDTO[]>(
      `${this.apiUrl}/api/restaurant/restaurantes`
    );
  }

  getRestaurantePorId(id: string): Observable<RestauranteDTO> {
    return this.http.get<RestauranteDTO>(
      `${this.apiUrl}/api/restaurant/restaurantes/${id}`
    );
  }
  // --- NUEVO MÉTODO (SAGA 2) ---
  asignarGestor(
    restauranteId: string,
    payload: GestorCreationDTO
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/gestores`,
      payload
    );
  }

  // --- NUEVO MÉTODO (PUT) ---
  actualizarRestaurante(
    id: string,
    payload: RestauranteUpdateDTO
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/restaurant/restaurantes/${id}`,
      payload
    );
  }

  getListarMesas(restauranteId: string): Observable<MesaDTO[]> {
    return this.http.get<MesaDTO[]>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/mesas`
    );
  }

  crearMesa(
    restauranteId: string,
    payload: MesaCreateDTO
  ): Observable<MesaDTO> {
    return this.http.post<MesaDTO>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/mesas`,
      payload
    );
  }

  // --- NUEVOS MÉTODOS PARA MENÚ ---

  getListarPlatos(restauranteId: string): Observable<PlatoDTO[]> {
    return this.http.get<PlatoDTO[]>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/platos`
    );
  }

  crearPlato(
    restauranteId: string,
    payload: PlatoCreateDTO
  ): Observable<PlatoDTO> {
    return this.http.post<PlatoDTO>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/platos`,
      payload
    );
  }

  // Asumo este endpoint basado en tu CategoriaPlatoController
  getListarCategoriasPlatos(): Observable<CategoriaPlatoDTO[]> {
    // (Ajusta la URL si es /api/restaurant/categorias-plato o similar)
    return this.http.get<CategoriaPlatoDTO[]>(
      `${this.apiUrl}/api/restaurant/categorias-plato`
    );
  }
}
