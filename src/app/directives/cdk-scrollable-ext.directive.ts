import { CdkScrollable } from '@angular/cdk/overlay';
import { AfterViewInit, Directive, EventEmitter, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: '[cdkScrollableExt]',
  exportAs: 'cdkScrollableExt'
})
export class CdkScrollableExtDirective implements  OnInit, OnDestroy {

  top: number = 0;
  topMax: number = 1;

  private subscription?: Subscription;

  constructor(private scrollable: CdkScrollable, private ngZone: NgZone) { }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    if (this.scrollable) {
      this.subscription = this.scrollable.elementScrolled().pipe(debounceTime(30)).subscribe(x => {
        const topSCroll = this.getTopScroll();
        this.ngZone.run(() => {
          [this.top, this.topMax] = topSCroll;
        });
      })
    }
  }

  private getTopScroll(): [number, number] {
    const scrollElem = this.scrollable.getElementRef().nativeElement;
    return [Math.ceil(this.scrollable.measureScrollOffset('top')), scrollElem.scrollHeight - scrollElem.clientHeight];
  }
}
