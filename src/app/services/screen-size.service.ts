import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ScreenSizeService {
  private isMobileSubject = new BehaviorSubject<boolean>(this.checkIsMobile());
  public isMobile$: Observable<boolean> = this.isMobileSubject.asObservable();

  constructor(private ngZone: NgZone) {
    fromEvent(window, 'resize')
      .pipe(
        startWith(this.checkIsMobile()),
        map(() => this.checkIsMobile())
      )
      .subscribe((isMobile) => {
        this.ngZone.run(() => this.isMobileSubject.next(isMobile));
      });
  }

  private checkIsMobile(): boolean {
    return window.innerWidth <= 850;
  }

  public isMobile(): boolean {
    return this.isMobileSubject.value;
  }
}
