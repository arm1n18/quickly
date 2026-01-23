import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {NgClass} from '@angular/common';

export type ButtonTheme = 'primary' | 'secondary' | 'hover-only' | 'hover-only-gray'

@Component({
  selector: 'app-custom-button',
  imports: [
    NgClass
  ],
  templateUrl: './custom-button.html',
  styleUrl: './custom-button.css'
})

export class CustomButton {
  @Input() className: string = '';
  @Input() rounded: 'none' | 'sm' | 'md' | 'full' | 'right-sm' | 'left-sm' = 'md';
  @Input() theme: ButtonTheme = 'primary';
  @Input() size: 'symbol' | 'text' | 'dual-child' = 'text';
  @Input() disabled: boolean = false;
}
