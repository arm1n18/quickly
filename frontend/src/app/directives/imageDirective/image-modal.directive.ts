import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, ElementRef, HostBinding, HostListener, Input } from '@angular/core';
import { Portal } from '../../services/portal/portal';
import { ImageModalComponent } from '../../components/ui';

@Directive({
  selector: '[appImageModalDirective]'
})

export class ImageModalDirective {
  constructor(private portal: Portal) {}

  @Input() alt: string = '';
  @Input() width?: string;
  @Input() height?: string;
  @Input() allowModal: boolean = false
  @Input() withOutline: boolean = true

  @HostBinding('style.cursor')
  get cursorStyle(): string {
    return this.allowModal ? 'zoom-in' : 'default';
  }

  @HostBinding('style.width')
  get widthStyle(): string {
    return this.width || "";
  }

  @HostBinding('style.height')
  get heightStyle(): string {
    return this.height || "";
  }

  @HostBinding('style.outline')
  get outlineStyle(): string | null {
    return this.withOutline ? '1px solid var(--lightGrey)' : null;
  }

  @HostBinding('style.outline-offset')
  get outlineOffsetStyle(): string | null {
    return this.withOutline ? '-1px' : null;
  }


  @HostListener('click', ['$event'])
  onClick(e: Event): void {
    if (!this.allowModal) return

    e.stopPropagation();
    e.preventDefault();

    const imgElement = e.target as HTMLImageElement;

    const modalPortal = new ComponentPortal(ImageModalComponent);
    this.portal.open(modalPortal, {
      image: imgElement.src
    });
  }
}

