import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthStateService } from '../../../features/auth/state/auth.state';

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
