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

export interface RestauranteUpdateDTO {
  nombre: string;
  telefono: string;
  horarioApertura: string; // "HH:mm:ss"
  horarioCierre: string; // "HH:mm:ss"
  direccion: DireccionDTO;
  // (Asumimos que 'activo' y 'entidad_fiscal_id' se manejan por separado)
}