import { Component } from '@angular/core';
import { Footer } from "../../layouts/footer/footer";
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { IconComponent } from "../../components/ui";

@Component({
  selector: 'app-test-info-page',
  imports: [Footer, MainLayout, IconComponent],
  templateUrl: './test-info-page.html',
  styleUrl: './test-info-page.css',
})
export class TestInfoPageComponent {

}
