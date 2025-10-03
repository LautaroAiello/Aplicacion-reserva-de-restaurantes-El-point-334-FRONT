import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MobileNavBar } from '../../components/mobile-nav-bar/mobile-nav-bar';

@Component({
  selector: 'app-cliente-layout',
  imports: [RouterOutlet, MobileNavBar],
  templateUrl: './cliente.html',
  styleUrl: './cliente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteLayout {
  protected mobile: boolean = false;

  constructor() {
    if (window.innerWidth < 768) {
      this.mobile = true;
    }
  }
}
