import { getUserDeviceInfo } from 'app/shared/utils/headers.utils';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface VerifyBody {
  email: string;
  code: number;
  purpose: 'login' | 'register';
}

@Injectable({
  providedIn: 'root',
})

export class AuthApiService {
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
    return this.http.post<{accessToken: string}>(`${this.apiRoute}/refresh`, null,
      { headers: { 'Cache-Control': 'no-cache' } }
    )
  }

  public logout(): Observable<void> {    
    return this.http.post<void>(`${this.apiRoute}/logout`, null, { responseType: 'text' as 'json' })
  }

  public reset(email: string): Observable<void> {    
    return this.http.post<void>(`${this.apiRoute}/reset`, {email: email}, { responseType: 'text' as 'json' })
  }

  public validResetToken(token: string): Observable<void> {    
    return this.http.get<void>(`${this.apiRoute}/reset/${token}`, { responseType: 'text' as 'json' })
  }

  public confirmReset(token: string, password: string): Observable<void> {    
    return this.http.post<void>(`${this.apiRoute}/reset/${token}`, {password: password}, { responseType: 'text' as 'json' })
  }
}
