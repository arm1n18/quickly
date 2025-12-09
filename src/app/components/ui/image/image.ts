import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ComponentPortal } from '@angular/cdk/portal';
import { ImageModal } from '../image-modal/image-modal';
import { Portal } from '../../../services/portal/portal';

interface ImageConfig {
  width: string,
  height: string,
  allowModal?: boolean
}

@Component({
  selector: 'app-image',
  imports: [NgStyle],
  templateUrl: './image.html',
  styleUrl: './image.css'
})

export class Image {
  constructor(private portal: Portal) {}

  @Input({required: true}) image: string = '';
  @Input({required: true}) config: ImageConfig = {
    width: 'fit-content',
    height: 'fit-content',
    allowModal: false
  };
  @Input() styles: { [key: string]: any} = {};

  
  openModal() {
    const modalPortal = new ComponentPortal(ImageModal);
    this.portal.open(modalPortal, {
      image: this.image
    });
  }

  closeModal(e: Event) {
    e.stopPropagation();
    const modalPortal = new ComponentPortal(ImageModal);
    this.portal.open(modalPortal);
  }
}
