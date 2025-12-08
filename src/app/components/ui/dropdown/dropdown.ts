import { Component, ElementRef, HostListener , Input } from '@angular/core';
import { CustomButton } from "../custom-button/custom-button";
import { NgClass } from '@angular/common';
import { Icon } from "../icon/icon";

export interface DropdownItem {
  title: any;
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
  preselected?: boolean;
}

// TODO_AUTO_POSITION

type DividerType = 'gap' | 'line';
type PositionXType = 'left' | 'right' | 'auto';
type PositionYType = | 'top' | 'bottom' | 'auto';

@Component({
  selector: 'app-dropdown',
  imports: [CustomButton, NgClass, Icon],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css'
})

export class Dropdown {
  constructor(private elementRef: ElementRef) {}
  
  @Input({ required: true }) list: DropdownItem[][] = [];
  @Input() config: Partial<{title: string, divider: DividerType}> = {
    title: '',
    divider: 'gap'
  };
  @Input() position: Partial<{px: PositionXType, py: PositionYType}> = {
    px: 'left',
    py: 'bottom'
  };
  show: boolean = false
  selectedValue: any | null

  select(value: any) {
    this.selectedValue = value
    this.toggleShow()
  }

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

  get preslectedValue(): string | undefined {
    if(this.selectedValue) {
      return this.selectedValue
    }

    const group = this.list.find(g =>
      g.some(v => v.preselected === true)
    );

    return group?.find(v => v.preselected === true)?.title;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target)
    console.log(clickedInside)
    if (!clickedInside) {
      this.show = false
    }
  }
}
