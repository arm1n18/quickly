import { Injectable } from '@angular/core';
import { AuthService } from '../api/auth.service';
import { AuthStateService } from '../auth/authStateService/auth-state.service';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private state: AuthStateService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    if(this.state.isAuthenticated()) {
      return true
    }

    return this.router.createUrlTree(['/'])
  }
}
