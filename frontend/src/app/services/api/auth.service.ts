import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SuccessResponse } from '../../interfaces/response.interface';
import { getUserDeviceInfo } from '../../utils/headers';

interface VerifyBody {
  email: string;
  code: number;
  purpose: 'login' | 'register';
}

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private apiRoute = '/auth';

  constructor(private http: HttpClient) {}

  public auth(auth: 'login' | 'register', email: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.apiRoute}/${auth}`, {email, password}, { responseType: 'text' as 'json' } )
  }
  
  public verify(body: VerifyBody): Observable<{accessToken: string}> {
    const ua = getUserDeviceInfo();
    
    return this.http.post<{accessToken: string}>(
      `${this.apiRoute}/verify`, body, 
      {
        headers: new HttpHeaders({
          "app-os": ua.OS,
          "app-device": ua.Device,
          "app-browser": ua.Browser,
        })
      } 
    )
  }

  public resendCode(email: string, purpose: 'login' | 'register'): Observable<void> {    
    return this.http.post<void>(`${this.apiRoute}/send-code`, {email, purpose}, { responseType: 'text' as 'json' })
  }

  public refresh(): Observable<{accessToken: string}> {    
    return this.http.get<{accessToken: string}>(`${this.apiRoute}/refresh`)
  }
}
