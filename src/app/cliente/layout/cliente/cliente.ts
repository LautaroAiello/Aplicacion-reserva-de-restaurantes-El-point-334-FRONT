import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ScreenSizeService } from '../../../services/screen-size.service';
import { Data, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MobileNavBar } from '../../components/mobile-nav-bar/mobile-nav-bar';
import { MobileHeader } from '../../components/mobile-header/mobile-header';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cliente-layout',
  imports: [RouterOutlet, MobileNavBar, MobileHeader],
  templateUrl: './cliente.html',
  styleUrl: './cliente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteLayout implements OnInit {
  protected mobile: boolean = false;
  private screenSizeService: ScreenSizeService = inject(ScreenSizeService);
  private router: Router = inject(Router);
  private destroy$: Subject<void> = new Subject<void>()
  private cdr = inject(ChangeDetectorRef);
  protected title: string = '';


  ngOnInit() {
    this.mobile = this.screenSizeService.isMobile();
    this.screenSizeService.isMobile$.subscribe((isMobile) => {
      this.mobile = isMobile;
    });

    this.setTitleFromRoute();

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.setTitleFromRoute();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setTitleFromRoute() {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const data: Data = route.snapshot.data;
    this.title = data['titulo'];
    this.cdr.markForCheck();
  }

}
