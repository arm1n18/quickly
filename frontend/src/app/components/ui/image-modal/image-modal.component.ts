import { NgClass } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { PortalService } from '../../../services/portal/portal';

@Component({
  selector: 'app-image-modal',
  imports: [NgClass],
  templateUrl: './image-modal.html',
  styleUrl: './image-modal.css',
})
export class ImageModalComponent {
  constructor(private portal: PortalService) {}
  image!: string;

  closeModal() {
    this.portal.close()
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.closeModal();
  }
}