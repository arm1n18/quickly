import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, map, Observable, of, take, tap, throwError } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { ApiService } from '../../api/api.service';
import { AuthStorageService } from '../authStorageService/auth-storage.service';
import { AuthStateService } from '../authStateService/auth-state.service';

interface JWTPayload {
  sub: string,
  avatar: string,
  email: string,
  username: string,
  exp: number,
  iat: number,
}

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private isRefreshing = false;
  private refresh$ = new BehaviorSubject<string | null>(null);

  constructor(
    private api: ApiService,
    private storage: AuthStorageService,
    private state: AuthStateService
  ) {
    this.init();
  }

  public init() {
    const token = this.storage.getToken()
    if(!token) return

    const payload = this.decode(token);
    this.state.setPayload(payload);
  }

  public updateToken(accessToken: string) {
    this.storage.saveToken(accessToken);
    this.state.setPayload(this.decode(accessToken))
    this.refresh$.next(accessToken);
  }

  private refreshToken(): Observable<string> {
    if(this.isRefreshing) {
      return this.refresh$.pipe(
        filter(Boolean),
        take(1),
      )
    }

    this.isRefreshing = true;
    this.refresh$.next(null);

    return this.api.auth.refresh().pipe(
      map(req => req.accessToken),
      tap(accessToken  => {
        this.isRefreshing = false;
        this.storage.saveToken(accessToken);
        this.state.setPayload(this.decode(accessToken))
        this.refresh$.next(accessToken);

        return of(accessToken)
      }),
      catchError(err => {
        this.isRefreshing = false;
        // recheck
        if(err.status != 0 && err.status != 500) {
          this.storage.removeToken();
          this.state.clear()
          this.refresh$.next(null);
        }
        return throwError(() => err);
      })
    )
  }

  public getValidToken(): Observable<string | null> {
    const token = this.storage.getToken();
    if(!token) return of(null)
    
    if(this.state.expired) {
      return this.refreshToken()
    }

    return of(token);
  }

  public logout() {
    this.storage.removeToken();
    this.state.clear();
  }


  private decode(token: string): JWTPayload {
    return jwtDecode<JWTPayload>(token);
  }
}
