import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';

import { MatChipsModule } from '@angular/material/chips';
@Component({
  selector: 'app-buscador-con-filtro',
  imports: [MatFormFieldModule, MatInput, MatLabel, MatIcon, MatChipsModule],
  templateUrl: './buscador-con-filtro.html',
  styleUrl: './buscador-con-filtro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorConFiltro {
    protected filtro:string[] = [];
    constructor(){
        this.filtro = [];
    }
}
