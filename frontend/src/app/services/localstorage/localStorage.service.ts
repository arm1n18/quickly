import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class LocalStorageService {
  
  public getAccessToken() {
   return localStorage.getItem("token") ?? ""
  }

  public setToLocalStorage(key: string, value: string) {
   return localStorage.setItem(key, value)
  }
}
