import {Component, HostListener, Input, TemplateRef} from '@angular/core';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import { PortalService } from '../../../services/portal/portal'
import { CustomButtonComponent } from '../custom-button/custom-button.component';
import { IconComponent } from '../icon/icon.component';


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
    CustomButtonComponent,
    IconComponent,
  ],
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})

export class ModalComponent {
  @Input() config: ModalConfig = { 
    showCross: true
  };

  constructor(private portal: PortalService) {}

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
