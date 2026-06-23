import { HeaderComponent, FooterComponent } from 'app/shared/components';
import { IconComponent } from 'app/shared/ui';
import { Component } from '@angular/core';


@Component({
  selector: 'app-module-info-page',
  imports: [
    HeaderComponent, 
    FooterComponent, 
    IconComponent,
  ],
  templateUrl: './module-info.page.html',
  styleUrl: './module-info.page.css',
})
export class ModuleInfoPageComponent {

}
