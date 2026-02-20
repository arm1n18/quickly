import { Component } from '@angular/core';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { Footer } from "../../layouts/footer/footer";
import { IconComponent } from "../../components/ui";

@Component({
  selector: 'app-module-info-page',
  imports: [MainLayout, Footer, IconComponent],
  templateUrl: './module-info-page.html',
  styleUrl: './module-info-page.css',
})
export class ModuleInfoPageComponent {

}
