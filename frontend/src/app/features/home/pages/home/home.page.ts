import { Component } from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { Router } from '@angular/router';
import { FooterComponent, HeaderComponent } from 'app/shared/components';
import { ButtonComponent } from 'app/shared/ui';
import { AuthStateService } from 'app/features/auth/state/auth.state';
import { PortalService } from 'app/core/services/portal/portal.service';
import { AuthFormComponent } from 'app/features/auth/components';

@Component({
  selector: 'home-page',
  imports: [
    HeaderComponent,
    ButtonComponent, 
    FooterComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export class HomePageComponent {
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
