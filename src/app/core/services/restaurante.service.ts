import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { MesaCreateDTO, MesaDTO } from '../models/mesa.model';
import {
  RegistroRestauranteDTO,
  RestauranteDTO,
  RestauranteUpdateDTO,
  EtiquetaDTO
} from '../models/restaurante.model';
import {
  CategoriaPlatoDTO,
  PlatoCreateDTO,
  PlatoDTO,
} from '../models/platos.model';
import { HttpParams } from '@angular/common/http';
import {GestorDTO, UsuarioCreationDTO} from '../models/usuario.models'



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

  // getListarRestaurantes(): Observable<RestauranteDTO[]> {
  //   return this.http.get<RestauranteDTO[]>(
  //     `${this.apiUrl}/api/restaurant/restaurantes`
  //   );
  // }
  getRestaurantes(usuarioId?: number): Observable<RestauranteDTO[]> {
    let url = `${this.apiUrl}/api/restaurant/restaurantes`;
    if (usuarioId) {
      url += `?usuarioId=${usuarioId}`;
    }
    return this.http.get<RestauranteDTO[]>(url);
  }

  getRestaurantePorId(id: string): Observable<RestauranteDTO> {
    return this.http.get<RestauranteDTO>(
      `${this.apiUrl}/api/restaurant/restaurantes/${id}`
    );
  }
  // --- NUEVO MÉTODO (SAGA 2) ---
  asignarGestor(
    restauranteId: string,
    payload: UsuarioCreationDTO
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/gestores`,
     payload,
      { responseType: 'text' } // <--- ¡ESTO ES CRUCIAL! Evita el error de parseo JSON
    );
  }

  // Obtener lista de gestores
  listarGestores(restauranteId: string): Observable<GestorDTO[]> {
    return this.http.get<GestorDTO[]>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/gestores`
    );
  }

  // Eliminar gestor (desvincular o borrar usuario)
  eliminarGestor(restauranteId: string, gestorId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/gestores/${gestorId}`
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

  getListarMesas(restauranteId: number | string): Observable<MesaDTO[]> {
    return this.http.get<MesaDTO[]>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/mesas`
    );
  }

  crearMesa(restauranteId: number | string, payload: MesaCreateDTO): Observable<MesaDTO> {
    return this.http.post<MesaDTO>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/mesas`,
      payload
    );
  }

  actualizarMesa(restauranteId: number | string, mesaId: number, payload: MesaCreateDTO): Observable<MesaDTO> {
    return this.http.put<MesaDTO>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/mesas/${mesaId}`,
      payload
    );
  }

  eliminarMesa(restauranteId: number | string, mesaId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/restaurant/restaurantes/${restauranteId}/mesas/${mesaId}`
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

  //EITIUQUETAS
  getEtiquetas(): Observable<EtiquetaDTO[]> {
    // Asegúrate de crear este endpoint en tu EtiquetaController del backend
    // O usa el de /restaurantes/etiquetas si lo pusiste ahí
    return this.http.get<EtiquetaDTO[]>(`${this.apiUrl}/api/restaurant/v1/etiquetas`); 
  }

  buscarRestaurantes(nombre: string, etiqueta: string): Observable<RestauranteDTO[]> {
    let params = new HttpParams();
    
    // Solo agregamos los parámetros si tienen valor
    if (nombre) params = params.set('nombre', nombre);
    if (etiqueta) params = params.set('etiqueta', etiqueta);

    return this.http.get<RestauranteDTO[]>(`${this.apiUrl}/api/restaurant/restaurantes/buscar`, { params });
  }

  // src/app/core/services/restaurante.service.ts

  toggleFavorito(restauranteId: number, usuarioId: number): Observable<boolean> {
    // POST a /favoritos/{restId}?usuarioId={userId}
    return this.http.post<boolean>(
      `${this.apiUrl}/api/restaurant/favoritos/${restauranteId}?usuarioId=${usuarioId}`, 
      {}
    );
  }

 getMisFavoritos(usuarioId: number): Observable<RestauranteDTO[]> {
    return this.http.get<RestauranteDTO[]>(
      `${this.apiUrl}/api/restaurant/favoritos/mis-favoritos?usuarioId=${usuarioId}`
    );
  }

  getPopulares(usuarioId?: number, top: number = 10): Observable<RestauranteDTO[]> {
    let url = `${this.apiUrl}/api/restaurant/favoritos/populares?top=${top}`;
    if (usuarioId) {
      url += `&usuarioId=${usuarioId}`;
    }
    return this.http.get<RestauranteDTO[]>(url);
  }
}
