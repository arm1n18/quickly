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

  public auth(auth: 'login' | 'register', email: string, password: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(`${this.apiRoute}/${auth}`, {email, password} )
  }
  
  public verify(body: VerifyBody): Observable<string> {
    const ua = getUserDeviceInfo();
    
    return this.http.post<string>(
      `${this.apiRoute}/verify`, body, 
      {
        headers: new HttpHeaders({
          "X-OS": ua.OS,
          "X-Device": ua.Device,
          "X-Browser": ua.Browser,
        })
      } 
    )
  }

  public resendCode(email: string, purpose: 'login' | 'register'): Observable<SuccessResponse> {    
    return this.http.post<SuccessResponse>(`${this.apiRoute}/send-code`, {email, purpose},)
  }
}
