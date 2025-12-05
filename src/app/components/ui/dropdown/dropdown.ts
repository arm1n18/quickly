import { Component, ElementRef, HostListener , Input } from '@angular/core';
import { CustomButton } from "../custom-button/custom-button";
import {NgClass} from '@angular/common';
import { Icon } from "../icon/icon";

export interface DropdownItem {
  title: string;
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
}

type DividerType = 'gap' | 'line';

@Component({
  selector: 'app-dropdown',
  imports: [CustomButton, NgClass, Icon],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css'
})

export class Dropdown {
  constructor(private elementRef: ElementRef) {}
  
  @Input({ required: true }) list: DropdownItem[][] = [];
  @Input({ required: true }) config: {title: string, divider?: DividerType} = {
    title: '',
    divider: 'gap'
  };
  show: boolean = false

  toggleShow () {
    this.show = !this.show
  }

  gapStyle (index: number, groupLength: number): {[klass: string]: boolean} {
    if(this.config.divider == 'gap') {
      if(groupLength === 1) return {'single': true}
      if(index == 0 && groupLength > 1) return {'top': true}
      if(index == groupLength && groupLength > 1) return {'bottom': true}
      if(index !== groupLength && index !== 0) return {'middle': true}
    }

    return {}
  }

  getGroupClasses(index: number, length: number) {
    return {
      'with-gap': this.config.divider === 'gap',
      ...this.gapStyle(index, length)
    };
  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target)
    if (!clickedInside) {
      this.show = false
    }
  }
}
