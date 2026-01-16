import { NgStyle, NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Icon ,Icons } from "../icon/icon";
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-custom-input',
  imports: [NgStyle, Icon, NgClass],
  templateUrl: './custom-input.html',
  styleUrl: './custom-input.css',
})

export class CustomInput {
  @Input() title: any;
  @Input() value: any;
  @Input() styles: { [key: string]: any} = {};
  @Input() width: string = '100%'
  @Input() icon: Partial<{show:boolean, name: Icons}> = {};
  @Output() inputChange = new EventEmitter<any>();
  private input$ = new Subject<string>();
  public focused: boolean = false

  constructor(private elementRef: ElementRef) {
    this.input$.pipe(debounceTime(500), takeUntilDestroyed()).subscribe(value => {
      this.inputChange.emit(value || '');
    })
  }

  public onInputChange(event: Event) {
    const newValue = (event.target as HTMLInputElement).value
    this.value = newValue
    this.input$.next(newValue)
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target)
    this.focused = clickedInside

    const input = this.elementRef.nativeElement.querySelector('input')

    if(input) {
      if(clickedInside){
        input.focus()
      } else {
        input.blur();
      }
    }
  }
}
