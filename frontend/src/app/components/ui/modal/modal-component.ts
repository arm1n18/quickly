import {Component, HostListener, Input, Output, TemplateRef} from '@angular/core';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import {CustomButton} from '../custom-button/custom-button';
import {Icon} from '../icon/icon';
import { Portal } from '../../../services/portal/portal'


interface ModalConfig {
  title?: string;
  showCross?: boolean;
  template?: TemplateRef<any>;
  onClose?: () => void;
}

@Component({
  selector: 'app-modal',
  imports: [
    NgClass,
    NgTemplateOutlet,
    CustomButton,
    Icon,
  ],
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})

export class ModalComponent {
  @Input() config: ModalConfig = { 
    showCross: true
  };

  constructor(private portal: Portal) {}

  public closeModal(e?: Event) {
    if(e) e.stopPropagation();
    this.portal.close()
    if (this.config.onClose) this.config.onClose()
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.closeModal();
  }
}
