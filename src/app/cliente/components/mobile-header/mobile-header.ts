import { ChangeDetectionStrategy, Component, input, InputSignal, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-mobile-header',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './mobile-header.html',
  styleUrl: './mobile-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileHeader {
  protected direccion: string = 'Calle Falsa 123, Springfield';
  public readonly title: InputSignal<string | null> = input.required();
}
