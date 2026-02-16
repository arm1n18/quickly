import { Component } from '@angular/core';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { CustomButtonComponent } from "../../components/ui";
import { Footer } from "../../layouts/footer/footer";
import { PortalService } from '../../services/portal/portal';
import { ComponentPortal } from '@angular/cdk/portal';
import { AuthFormComponent } from '../../components';

@Component({
  selector: 'app-main-page',
  imports: [MainLayout, CustomButtonComponent, Footer],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPageComponent {
  constructor(
    private portal: PortalService
  ) {}

  public toggleAuthModal(state: boolean, mode: 'register' | 'login') {
    if (state && !this.portal.isAnyOpen()) {
      this.portal.open(new ComponentPortal(AuthFormComponent), {
        mode: mode
      });
    } else if (!state && this.portal.isAnyOpen()) {
      this.portal.close();
    }
  }
}
