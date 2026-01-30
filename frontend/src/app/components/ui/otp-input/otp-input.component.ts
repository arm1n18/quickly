import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { NumberOnly } from "../../../directives/numberOnlyDirective/number-only.directive";

@Component({
  selector: 'app-otp-input',
  imports: [NumberOnly],
  templateUrl: './otp-input.html',
  styleUrl: './otp-input.css',
})

export class OtpInputComponent {
  @Input() length: number = 6;
  @Output() inputChange = new EventEmitter<{id: number, value: string}>();
  selectedOtp: number = 2;
  values: string[] = [];

  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  get otp(): number[] {
    return Array.from({ length: this.length }, (_, i) => i);
  }

  public onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;

    switch (input.selectionStart) {
      case 1: {
        this.values[index] = input.value[0];
        // input.value = input.value[0];
        this.inputChange.emit({id: index, value: input.value[0]})
        break
      }
      case 2:
        {
          const len = input.value.length-1
          this.values[index] = input.value[len];
          this.inputChange.emit({id: index, value: input.value[len]})
          // input.value = input.value[len];
          break
        }
    }
    
    if (input.value && index < this.inputs.length - 1) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  public onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && index > 0) {
      this.values[index] = ''
      this.inputChange.emit({id: index, value: ''})
      this.inputs.toArray()[index - 1].nativeElement.focus();
      event.preventDefault();
    }
  }
}
