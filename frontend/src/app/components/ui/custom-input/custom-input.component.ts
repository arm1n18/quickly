import { NgStyle, NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { IconComponent,Icons } from "../icon/icon.component";
import { BehaviorSubject, debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-custom-input',
  imports: [NgStyle, IconComponent, NgClass],
  templateUrl: './custom-input.html',
  styleUrl: './custom-input.css',
})

export class CustomInputComponent {
  @Input() inputId: string | undefined;
  @Input() title: string = '';
  @Input() isPassword: boolean = false;
  @Input() disabled: boolean = false;

  @Input() set value(val: string) {
    this._value = val;
  }
  @Input() set delay(value: number) {
    this._delay$.next(value ?? 500);
  };

  @Input() styles: { [key: string]: any} = {};
  @Input() width: string = '100%';
  @Input() icon: Partial<{show:boolean, name: Icons}> = {};
  @Input() maxLength: number | null = null; 
  @Input() allowClear: boolean = false;

  @Input() onSubmit?: () => void;

  private _value: string = '';
  private _delay$ = new BehaviorSubject<number>(500);
  private input$ = new Subject<string>();

  public focused: boolean = false;
  public type: string | null = null;
    
  @Output() inputChange = new EventEmitter<any>();
  @Output() inputFocused = new EventEmitter<boolean>();

  constructor(private elementRef: ElementRef) {
    this.input$.pipe(debounceTime(this.delay), takeUntilDestroyed()).subscribe(value => {
      this.inputChange.emit(value || '');
    })
  }

  public onInputChange(event: Event) {
    event.preventDefault()
    event.stopPropagation();
    
    const newValue = (event.target as HTMLInputElement).value
    this.changeInput(newValue)
  }

  public changeInput(value: string) {
    this._value = value
    this.input$.next(value)
  }

  public showPassword() {
    if(this.type == "password") {
      this.type = null
    } else {
      this.type = "password"
    }
  }

  get value(): string {
    return this._value;
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
    if(this.isPassword) {
      this.showPassword()
    }
  }

  @HostListener('window:keydown', ['$event'])
  onEnter(e: KeyboardEvent) {
    const target = e.target as HTMLElement;

    if (e.key !== 'Enter') return;

    if (target.tagName !== 'INPUT' || !this.focused) return;
    if(!(this._value.trim().length > 0)) {
      this.focused = false;
      const input = this.elementRef.nativeElement.querySelector('input');
      input.blur();
      this.inputFocused.emit(false);
      
      return
    }

    this.onSubmit?.();
  }
}
