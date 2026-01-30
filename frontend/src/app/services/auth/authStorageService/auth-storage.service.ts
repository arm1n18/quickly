import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthStorageService {
  
  public getToken(): string | null {
    return localStorage.getItem("token")
  }

  public saveToken(token: string) {
    localStorage.setItem("token", token)
  }

  public removeToken() {
    localStorage.removeItem("token")
  }
}
