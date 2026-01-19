import { Component, HostListener, Input } from '@angular/core';
import { Icon } from "../icon/icon";
import { Router } from '@angular/router';
import { CustomButton } from "../custom-button/custom-button";

interface ModuleItemInterface {
  title: string;
  objects: number;
  hasImage: boolean;
  type: 'Module' | 'Folder';
  href: string;
}

@Component({
  selector: 'app-module-item',
  imports: [Icon, CustomButton],
  templateUrl: './module-item.html',
  styleUrl: './module-item.css',
})

export class ModuleItem {
  @Input({required: true}) module: ModuleItemInterface | undefined;

  constructor(
    private router: Router
  ) {}

  @HostListener('click')
  onClick() {
    this.router.navigate([this.module?.href])
  }
}
