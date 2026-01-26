import { NgClass } from '@angular/common';
import { Component, HostBinding, HostListener, Inject, Input } from '@angular/core';
import { Portal } from '../../../services/portal/portal';

@Component({
  selector: 'app-image-modal',
  imports: [NgClass],
  templateUrl: './image-modal.html',
  styleUrl: './image-modal.css',
})
export class ImageModal {
  constructor(private portal: Portal) {}
  image!: string;

  closeModal() {
    this.portal.close()
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.closeModal();
  }
}