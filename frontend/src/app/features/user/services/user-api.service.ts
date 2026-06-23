import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserInfo } from '../models/user.interface';

@Injectable({
  providedIn: 'root',
})

export class UserApiService {
  private apiRoute = '/users';

  constructor(private http: HttpClient) {}

  public getUserProfile(username: string): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiRoute}/${username}`)
  }

  public changeUsername(username: string): Observable<{accessToken: string}> {
    return this.http.patch<{accessToken: string}>(`${this.apiRoute}/me`, {username: username})
  }
}
