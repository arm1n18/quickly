import { Component, Input } from '@angular/core';
import { Icon } from "../icon/icon";

interface ModuleItemInterface {
  title: string;
  objects: number;
  hasImage: boolean;
  type: 'Module' | 'Folder';
  href: string;
}

@Component({
  selector: 'app-module-item',
  imports: [Icon],
  templateUrl: './module-item.html',
  styleUrl: './module-item.css',
})

export class ModuleItem {
  @Input({required: true}) module: ModuleItemInterface | undefined;
}
