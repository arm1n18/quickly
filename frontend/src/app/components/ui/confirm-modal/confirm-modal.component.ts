import { Component, HostListener, Input } from '@angular/core';
import { PortalService } from '../../../services/portal/portal';
import { NgClass } from '@angular/common';
import { CustomButtonComponent } from '../custom-button/custom-button.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-modal',
  imports: [CustomButtonComponent, IconComponent, NgClass],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css',
})

export class ConfirmModalComponent {
  @Input({required: true}) title: string = "";
  @Input({required: true}) description: string = "";
  @Input() warning: string = "";
  @Input() danger: boolean = false;
  @Input() onConfirm: () => void = () => {};
  
  constructor(private portal: PortalService) {}

  public closeModal(e?: Event) {
    if(e) e.stopPropagation();
    this.portal.close()
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.closeModal();
  }
}
