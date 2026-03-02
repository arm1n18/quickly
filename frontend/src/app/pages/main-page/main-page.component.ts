import { Component } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { CustomButtonComponent } from "../../components/ui";
import { Footer } from "../../layouts/footer/footer";
import { PortalService } from '../../services/portal/portal';
import { ComponentPortal } from '@angular/cdk/portal';
import { AuthFormComponent } from '../../components';
import { Router } from '@angular/router';
import { AuthStateService } from '../../services/auth/authStateService/auth-state.service';

@Component({
  selector: 'app-main-page',
  imports: [MainLayoutComponent, CustomButtonComponent, Footer],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPageComponent {
  constructor(
    private auth: AuthStateService,
    private router: Router,
    private portal: PortalService
  ) {}

  public findModules() {
    this.router.navigate(['/search'])
  }

  public toggleAuthModal(state: boolean, mode: 'register' | 'login') {
    if (state && !this.portal.isAnyOpen()) {
      this.portal.open(new ComponentPortal(AuthFormComponent), {
        mode: mode
      });
    } else if (!state && this.portal.isAnyOpen()) {
      this.portal.close();
    }
  }

  get isAuthenticated() {
    return this.auth.isAuthenticated()
  }
}
