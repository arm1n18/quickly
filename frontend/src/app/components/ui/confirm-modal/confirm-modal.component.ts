import { Component, HostListener, Input } from '@angular/core';
import { Portal } from '../../../services/portal/portal';
import { CustomButton } from "../custom-button/custom-button";
import { Icon } from "../icon/icon";
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  imports: [CustomButton, Icon, NgClass],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css',
})

export class ConfirmModalComponent {
  @Input() title: string = "";
  @Input() description: string = "";
  @Input() warning: string = "";
  @Input() danger: boolean = false;
  @Input() onConfirm: () => void = () => {};
  
  constructor(private portal: Portal) {}

  public closeModal(e?: Event) {
    if(e) e.stopPropagation();
    this.portal.close()
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.closeModal();
  }
}
