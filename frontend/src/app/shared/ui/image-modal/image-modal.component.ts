import { NgClass } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { PortalService } from 'app/core/services/portal/portal.service';

@Component({
  selector: 'app-image-modal',
  imports: [NgClass],
  templateUrl: './image-modal.component.html',
  styleUrl: './image-modal.component.css',
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