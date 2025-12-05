import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {NgClass} from '@angular/common';

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
  @Input() theme: 'primary' | 'secondary' | 'hover-only' = 'primary';
  @Input() size: 'symbol' | 'text' | 'dual-child' = 'text';
  @Input() disabled: boolean = false;
}
