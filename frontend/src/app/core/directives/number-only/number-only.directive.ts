import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appNumberOnly]'
})
export class NumberOnlyDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInputChange(event: Event) {
    const initialValue = this.el.nativeElement.value;
    const newValue = initialValue.replace(/[^0-9]*/g, ''); 

    this.el.nativeElement.value = newValue;

    if (initialValue !== newValue) {
      this.el.nativeElement.dispatchEvent(new Event('input')); 
    }
  }

}
