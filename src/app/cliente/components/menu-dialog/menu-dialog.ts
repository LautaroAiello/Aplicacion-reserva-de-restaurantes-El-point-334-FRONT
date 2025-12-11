import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Plato } from '../../../core/models/restaurante.model';

export interface MenuDialogData {
  nombreRestaurante: string;
  menu: Plato[];
  mostrarPrecios: boolean;
}

@Component({
  selector: 'app-menu-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './menu-dialog.html',
  styleUrls: ['./menu-dialog.scss']
})
export class MenuDialogComponent {
  public data = inject<MenuDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<MenuDialogComponent>);

  cerrar() {
    this.dialogRef.close();
  }
}