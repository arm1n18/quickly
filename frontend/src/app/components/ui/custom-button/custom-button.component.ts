import {Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';

export type ButtonTheme = 'primary' | 'secondary' | 'hover-only' | 'hover-only-dark'

@Component({
  selector: 'app-custom-button',
  imports: [
    NgClass
  ],
  templateUrl: './custom-button.html',
  styleUrl: './custom-button.css'
})

export class CustomButtonComponent {
  @Input() className: string = '';
  @Input() rounded: 'none' | 'sm' | 'md' | 'full' | 'right-sm' | 'left-sm' = 'md';
  @Input() danger: boolean = false;
  @Input() theme: ButtonTheme = 'primary';
  @Input() size: 'symbol' | 'text' | 'dual-child' | 'w-full' = 'text';
  @Input() disabled: boolean = false;
  @Input() loading: {isLoading: boolean, title?: string} = { isLoading: false };
  @Input() type: string = 'button';
}
