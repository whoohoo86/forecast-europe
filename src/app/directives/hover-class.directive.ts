import { Directive, HostListener, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[hoverClass]'
})
export class HoverClassDirective {

  constructor(private elementRef: ElementRef) { }

  @Input('hoverClass') hoverClass?: string;

  @HostListener('mouseenter') onMouseEnter() {
    if (this.hoverClass) {
      this.elementRef.nativeElement.classList.add(this.hoverClass);
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.hoverClass) {
      this.elementRef.nativeElement.classList.remove(this.hoverClass);
    }
  }

}
