import { Component, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { CustomButtonComponent } from '../custom-button/custom-button.component';

interface ModuleItemInterface {
  title: string;
  objects: number;
  hasImage: boolean;
  type: 'Module' | 'Folder';
  href: string;
}

@Component({
  selector: 'app-module-item',
  imports: [IconComponent, CustomButtonComponent],
  templateUrl: './module-item.html',
  styleUrl: './module-item.css',
})

export class ModuleItemComponent {
  @Input({required: true}) module: ModuleItemInterface | undefined;

  constructor(
    private router: Router
  ) {}

  @HostListener('click')
  onClick() {
    this.router.navigate([this.module?.href])
  }
}
