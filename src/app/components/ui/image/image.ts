import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

interface ImageConfig {
  width: string,
  height: string,
  allowModal?: boolean
}

@Component({
  selector: 'app-image',
  imports: [NgClass],
  templateUrl: './image.html',
  styleUrl: './image.css'
})

export class Image {
  @Input({required: true}) image: string = '';
  @Input({required: true}) config: ImageConfig = {
    width: 'fit-content',
    height: 'fit-content',
    allowModal: false
  };
  showModal: boolean = false;

  openModal(e: Event) {
    e.stopPropagation();

    this.showModal = true
  }

  closeModal(e: Event) {
    e.stopPropagation();
    this.showModal = false;
  }
}
