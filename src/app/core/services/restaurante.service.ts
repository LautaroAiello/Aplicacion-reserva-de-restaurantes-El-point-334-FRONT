import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { MesaCreateDTO, MesaDTO } from '../models/mesa.model';
import {
  RegistroRestauranteDTO,
  RestauranteDTO,
  RestauranteUpdateDTO,
} from '../models/restaurante.model';
import {
  CategoriaPlatoDTO,
  PlatoCreateDTO,
  PlatoDTO,
} from '../models/platos.model';

// DTO para la SAGA 2 (Asignar Gestor)
// (basado en el DTO de restaurant-service y la SAGA)
export interface GestorCreationDTO {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
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

  getListarMesas(restauranteId: number): Observable<MesaDTO[]> {
    return this.http.get<MesaDTO[]>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/mesas`
    );
  }

  crearMesa(
    restauranteId: number,
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
      `${this.apiUrl}/api/restaurant/restaurantes/categoriasPlato`
    );
  }

  // PUT: Actualizar Plato
  actualizarPlato(
    restauranteId: string,
    platoId: number,
    payload: PlatoCreateDTO
  ): Observable<PlatoDTO> {
    return this.http.put<PlatoDTO>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/platos/${platoId}`,
      payload
    );
  }

  // DELETE: Eliminar Plato
  eliminarPlato(restauranteId: string, platoId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/platos/${platoId}`
    );
  }

  eliminarRestaurante(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/restaurant/restaurantes/${id}`
    );
  }
}
