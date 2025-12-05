import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  /**
   * Muestra un mensaje de éxito (icono verde)
   */
  success(title: string, text: string = '') {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'success',
      confirmButtonColor: '#4CAF50', // Verde compatible con tu tema
      confirmButtonText: 'Aceptar'
    });
  }

  /**
   * Muestra un mensaje de error (icono rojo)
   */
  error(title: string, text: string = '') {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'error',
      confirmButtonColor: '#f44336',
      confirmButtonText: 'Cerrar'
    });
  }

  /**
   * Muestra un diálogo de confirmación (icono advertencia)
   * Retorna true si el usuario confirma, false si cancela.
   */
  async confirm(title: string, text: string, confirmButtonText: string = 'Sí, confirmar'): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3f51b5', // Azul primario
      cancelButtonColor: '#d33',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed;
  }
}