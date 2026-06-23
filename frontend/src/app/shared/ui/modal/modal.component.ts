import {Component, HostListener, Input, TemplateRef} from '@angular/core';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { PortalService } from 'app/core/services/portal/portal.service';



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
    ButtonComponent,
    IconComponent,
  ],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
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
