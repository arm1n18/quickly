import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { Footer } from "../../layouts/footer/footer";
import { IconComponent } from "../../components/ui";

@Component({
  selector: 'app-module-info-page',
  imports: [MainLayoutComponent, Footer, IconComponent],
  templateUrl: './module-info-page.html',
  styleUrl: './module-info-page.css',
})
export class ModuleInfoPageComponent {

}
