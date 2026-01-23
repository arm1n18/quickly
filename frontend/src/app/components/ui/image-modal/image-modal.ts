import { NgClass } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
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
}