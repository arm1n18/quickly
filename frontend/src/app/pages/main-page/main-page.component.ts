import { Component } from '@angular/core';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { CustomButtonComponent } from "../../components/ui";
import { Footer } from "../../layouts/footer/footer";

@Component({
  selector: 'app-main-page',
  imports: [MainLayout, CustomButtonComponent, Footer],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPageComponent {

}
