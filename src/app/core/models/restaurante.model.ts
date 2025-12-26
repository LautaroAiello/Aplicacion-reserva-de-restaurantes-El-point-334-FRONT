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
  configuracion?: ConfiguracionRestauranteDTO;
  esFavorito?: boolean;
  menu: Plato[];
  cantidadReservas?: number;
}

// Define tu DTO complejo
export interface RegistroRestauranteDTO {
  // Datos del Restaurante
  nombre: string;
  telefono: string;
  horarioApertura: string; // "HH:mm:ss"
  horarioCierre: string; // "HH:mm:ss"
  imagenUrl: string;

  cuit: string; // <--- NUEVO
  razonSocial: string; // <--- NUEVO

  direccion: DireccionDTO;

  // Datos Admin
  nombreUsuario: string;
  apellidoUsuario: string;
  emailUsuario: string;
  passwordUsuario: string;
  telefonoUsuario: string;
}

export interface RestauranteUpdateDTO {
  nombre: string;
  telefono: string;
  horarioApertura: string; // "HH:mm:ss"
  horarioCierre: string; // "HH:mm:ss"
  direccion: DireccionDTO;
  imagenUrl: string;
  configuracion: ConfiguracionRestauranteDTO;
}
export interface ConfiguracionRestauranteDTO {
  tiempoAnticipacionMinutos: number;
  minPersonasEventoLargo: number;
  mostrarPrecios: boolean;
}

export interface EtiquetaDTO {
  id: number;
  nombre: string;
  imagenUrl: string;
}

export interface Plato {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string;
  estado: string;     
  nombreCategoria: string;
}