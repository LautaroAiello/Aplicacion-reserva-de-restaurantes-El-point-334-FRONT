import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

// Define interfaces para tus DTOs (Data Transfer Objects)
// Esto debe coincidir con lo que tu backend espera y devuelve
export interface AuthResponse {
  token: string;
  tokenType: string;
  roles: string[];
  restauranteRoles: RestauranteRole[];
}

export interface LoginPayload {
  email: string;
  password: string;
}
// Para la respuesta de POST /login
export interface RestauranteRole {
  restauranteId: number;
  rol: string;
}

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string; // Tu backend lo recibe y lo hashea
  telefono: string;
}

interface DecodedToken {
  usuarioId: string; // La claim de tu metadata
  roles: string[];
  restauranteRoles: RestauranteRole[];
  // ... (iat, exp, sub, etc.)
}
export interface UserInfo {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  roles: string[];
  restauranteRoles: RestauranteRole[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private router = inject(Router);
  // Claves para localStorage
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly ROLES_KEY = 'user_roles';
  private readonly REST_ROLES_KEY = 'user_restaurante_roles';
  // Un signal para saber si el usuario está autenticado
  public isAuthenticated = signal<boolean>(this.hasToken());

  constructor() {
    // (Opcional) Validar token al inicio
    // this.validateTokenOnStartup();
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/api/auth/login`, payload)
      .pipe(
        tap((response) => this.saveSession(response)) // Guardamos toda la sesión
      );
  }
  // Registro de Comensal (POST /auth/usuarios)
  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/usuarios`, payload);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    localStorage.removeItem(this.REST_ROLES_KEY);

    this.isAuthenticated.set(false);
    this.router.navigate(['/login']); // Redirigir al login de cliente
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    // Guardamos los roles en localStorage para no tener que decodificar el JWT
    // en cada llamada al Guard, lo cual es más performante.
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(response.roles || []));
    localStorage.setItem(
      this.REST_ROLES_KEY,
      JSON.stringify(response.restauranteRoles || [])
    );

    this.isAuthenticated.set(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  getUsuarioIdFromToken(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const decodedToken: DecodedToken = jwtDecode(token);
      return decodedToken.usuarioId; // <-- La forma correcta
    } catch (error) {
      console.error('Error decodificando el token:', error);
      this.logout(); // Si el token es malo, cerramos sesión
      return null;
    }
  }

  // --- MÉTODO 2 (Asincrónico y Seguro) ---
  /**
   * Llama al backend para obtener los datos del usuario.
   * Se usa para MOSTRAR DATOS (ej: página de Perfil).
   */
  getMiPerfil(): Observable<UserInfo> {
    // El interceptor JWT (que ya creamos) añadirá el token a esta llamada
    return this.http.get<UserInfo>(`${this.apiUrl}/api/auth/usuarios/me`).pipe(
      catchError((err) => {
        this.logout(); // Si el token es malo, cerramos sesión
        return throwError(() => err);
      })
    );
  }
  // --- MÉTODOS DE ROLES (PARA LOS GUARDS) ---

  /**
   * Obtiene los roles globales (ej: 'ADMIN', 'USER') desde localStorage.
   */
  getRoles(): string[] {
    const rawRoles = localStorage.getItem(this.ROLES_KEY);
    return rawRoles ? JSON.parse(rawRoles) : [];
  }

  /**
   * Verifica si el usuario tiene un rol global específico.
   * @param role El rol a verificar (ej: 'ADMIN')
   */
  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  /**
   * Obtiene los roles por restaurante desde localStorage.
   */
  getRestauranteRoles(): RestauranteRole[] {
    const rawRoles = localStorage.getItem(this.REST_ROLES_KEY);
    return rawRoles ? JSON.parse(rawRoles) : [];
  }

  /**
   * Verifica si el usuario tiene un rol específico en un restaurante específico.
   */
  hasRestauranteRole(restauranteId: string, rol: string): boolean {
    const idNum = parseInt(restauranteId, 10);
    return this.getRestauranteRoles().some(
      (r) => r.restauranteId === idNum && r.rol === rol
    );
  }
}
