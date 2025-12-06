import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass} from '@angular/common';
import {CustomButton} from '../custom-button/custom-button';
import {Icon} from '../icon/icon';

interface ModalConfig {
  showCross: boolean;
}

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
  @Input() config: ModalConfig = {
    showCross: true
  };
  @Output() shownChange = new EventEmitter<boolean>();

  closeModal(e: Event) {
    e.stopPropagation();
    this.shownChange.emit(false);
  }
}
