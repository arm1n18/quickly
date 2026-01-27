import { NgStyle, NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Icon ,Icons } from "../icon/icon";
import { BehaviorSubject, debounceTime, Subject } from 'rxjs';
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
  @Input() password: boolean = false;
  @Input() inputId: string | undefined;
  @Input() set delay(value: number) {
    this._delay$.next(value ?? 500);
  };
  @Input() styles: { [key: string]: any} = {};
  @Input() width: string = '100%'
  @Input() icon: Partial<{show:boolean, name: Icons}> = {};
  @Output() inputChange = new EventEmitter<any>();
  @Output() inputFocused = new EventEmitter<boolean>();
  private _delay$ = new BehaviorSubject<number>(500);
  private input$ = new Subject<string>();
  public focused: boolean = false
  public type: string | null = null;

  constructor(private elementRef: ElementRef) {
    this.input$.pipe(debounceTime(this.delay), takeUntilDestroyed()).subscribe(value => {
      this.inputChange.emit(value || '');
    })
  }

  public onInputChange(event: Event) {
    const newValue = (event.target as HTMLInputElement).value
    this.value = newValue
    this.input$.next(newValue)
  }

  public showPassword() {
    if(this.type == "password") {
      this.type = null
    } else {
      this.type = "password"
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target)
    this.focused = clickedInside

    const input = this.elementRef.nativeElement.querySelector('input')

    if(input) {
      if(clickedInside){
        input.focus()
        this.inputFocused.emit(true);
      } else {
        input.blur();
        this.inputFocused.emit(false);
      }
    }
  }

  ngOnInit() {
    if(this.password) {
      this.showPassword()
    }
  }
}
