import { Component, ContentChild, ElementRef, HostListener , Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent, Icons } from '../icon/icon.component';
import { ButtonTheme, CustomButtonComponent } from '../custom-button/custom-button.component';
import { DropdownService } from '../../../services/dropdownService/dropdown-service';

export interface DropdownItem {
  title: {
    text: string,
    color?: string;
  };
  onClick?: () => void;
  icon?: {
    name: Icons,
    color?: string;
  };
  disabled?: boolean;
  preselected?: boolean;
}

export interface DropdownConfig {
  title: {
    text: string,
    color?: string;
  };
  divider: DividerType;
  rememberSelection: boolean;
  theme: ButtonTheme,
  icon?: {
    name: Icons,
    color?: string;
  };
}

// TODO_AUTO_POSITION

type DividerType = 'gap' | 'line';
type PositionXType = 'left' | 'right' | 'auto';
type PositionYType = | 'top' | 'bottom' | 'auto';

@Component({
  selector: 'app-dropdown',
  imports: [CustomButtonComponent, NgClass, IconComponent],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css'
})

export class DropdownComponent {
  constructor(
    private elementRef: ElementRef,
    private dropdown: DropdownService,
  ) {}
  
  @Input({ required: true }) list: DropdownItem[][] = [];
  @Input() config: Partial<DropdownConfig> = {
    divider: 'gap',
    rememberSelection: true,
    theme: 'hover-only'
  };
  @Input() position: Partial<{px: PositionXType, py: PositionYType}> = {
    px: 'left',
    py: 'bottom'
  };
  public show: boolean = false;
  private selectedValue: any | null;
  private id: symbol = Symbol();

  public select(e:Event, value: any) {
    if(this.config.rememberSelection) {
      this.selectedValue = value
    }
    this.toggleShow(e)
  }

  public toggleShow (e: Event) {
    e.stopPropagation()
    
    this.show = !this.show

    if (this.show) {
      this.dropdown.open(this.id, this);
    } else {
      this.dropdown.close(this.id, this);
    }
  }

  public close() {
    this.show = false;
  }

  public gapStyle (index: number, groupLength: number): {[klass: string]: boolean} {
    if(this.config.divider == 'gap') {
      if(index == 0 && groupLength > 1) return {'top': true}
      if(index == groupLength-1 && groupLength > 1) return {'bottom': true}
      if(index !== groupLength-1 && index !== 0) return {'middle': true}
      if(groupLength === 1) return {'single': true}
    }

    return {}
  }

  public getGroupClasses(index: number, length: number) {
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

    return group?.find(v => v.preselected === true)?.title.text;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target)
    if (!clickedInside) {
      this.show = false;
      this.dropdown.close(this.id, this);
    }
  }

  @ContentChild(CustomButtonComponent, { static: false })
  btnContent?: CustomButtonComponent

  get hasBtn(): boolean {
    return !!this.btnContent
  }
}
