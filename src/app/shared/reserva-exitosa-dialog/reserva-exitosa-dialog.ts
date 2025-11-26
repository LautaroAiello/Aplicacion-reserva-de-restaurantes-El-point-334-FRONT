import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reserva-exitosa-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-content">
      <div class="icon-circle">
        <mat-icon>check</mat-icon>
      </div>
      <h2 mat-dialog-title>¡Reserva Exitosa!</h2>
      <mat-dialog-content>
        <p>Tu reserva ha sido creada correctamente.</p>
        <p>Te hemos enviado un email con los detalles.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="center">
        <button mat-flat-button color="primary" (click)="cerrar()">Entendido</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-content { text-align: center; padding: 20px; }
    .icon-circle {
      background-color: #4caf50;
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px auto;
    }
    mat-icon { font-size: 30px; width: 30px; height: 30px; }
    h2 { margin-bottom: 10px; color: #333; }
  `]
})
export class ReservaExitosaDialog {
  private dialogRef = inject(MatDialogRef<ReservaExitosaDialog>);

  cerrar() {
    this.dialogRef.close(true); // Retorna true al cerrar
  }
}