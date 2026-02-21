import { Component } from '@angular/core';
import { Footer } from "../../layouts/footer/footer";
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { IconComponent } from "../../components/ui";

@Component({
  selector: 'app-test-info-page',
  imports: [Footer, MainLayoutComponent, IconComponent],
  templateUrl: './test-info-page.html',
  styleUrl: './test-info-page.css',
})
export class TestInfoPageComponent {

}
