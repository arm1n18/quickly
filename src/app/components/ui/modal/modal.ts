import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass} from '@angular/common';
import {CustomButton} from '../custom-button/custom-button';
import {Icon} from '../icon/icon';

@Component({
  selector: 'app-modal',
  imports: [
    NgClass,
    CustomButton,
    Icon,
  ],
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})

export class Modal {
  @Input({ required: true }) show: boolean = false;
  @Output() shownChange = new EventEmitter<boolean>();

  closeModal() {
    this.shownChange.emit(false);
  }
}
