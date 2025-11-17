import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../../core/services/auth.service';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-cliente-perfil-page',
  standalone: true, // <-- ¡Importante!
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientePerfilPage implements OnInit {
  private authService = inject(AuthService);

  // Un signal para guardar la info del usuario
  protected usuario = signal<UserInfo | null>(null);
  protected cargando = signal<boolean>(true);

  ngOnInit() {
    // LLAMAMOS AL NUEVO MÉTODO ASINCRÓNICO
    this.authService.getMiPerfil().subscribe({
      next: (infoUsuario) => {
        // Cuando el backend responde, guardamos los datos
        this.usuario.set(infoUsuario);
        this.cargando.set(false);
      },
      error: (err) => {
        // El authService ya maneja el logout si el token es malo
        console.error('Error al cargar el perfil:', err);
        this.cargando.set(false);
      },
    });
  }

  /**
   * Llama al servicio de autenticación para cerrar la sesión.
   * El servicio se encargará de borrar el token y redirigir.
   */
  cerrarSesion() {
    this.authService.logout();
  }
}
