import { ChangeDetectionStrategy, Component } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-mobile-nav-bar',
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './mobile-nav-bar.html',
  styleUrl: './mobile-nav-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileNavBar {

}
