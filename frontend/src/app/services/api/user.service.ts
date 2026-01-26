import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserInfo } from '../../interfaces/user.interface';
import { FoldersSummary } from '../../interfaces/folder.interface';

@Injectable({
  providedIn: 'root',
})

export class UserService {
  private apiRoute = '/user';

  constructor(private http: HttpClient) {}

  public getUserProfile(username: string): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiRoute}/${username}`)
  }

}
