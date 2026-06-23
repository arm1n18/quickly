import { Component, HostListener, Input } from '@angular/core';
import { PortalService } from 'app/core/services/portal/portal.service';
import { NgClass } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
@Component({
  selector: 'app-confirm-modal',
  imports: [NgClass, ButtonComponent, IconComponent],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css',
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
