import { Injectable } from '@angular/core';
import { jwtDecode } from "jwt-decode";
import { LocalStorageService } from '../localstorage/localStorage.service';

interface TokenPayload {
  sub: string,
  avatar: string,
  email: string,
  username: string,
}

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  public tokenPayload: TokenPayload | null = null;
  public isLoggedIn: boolean = false;

  constructor(private localStorage: LocalStorageService) {
    this.loadToken();
  }

  private loadToken() {
    const token = this.localStorage.getAccessToken();
    if (token) {
      this.tokenPayload = jwtDecode(token);
      this.isLoggedIn = true
    }
  }

  public getPayload(): TokenPayload | null {
    return this.tokenPayload;
  }
}
