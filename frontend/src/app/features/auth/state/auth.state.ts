import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, map } from 'rxjs';

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

export class AuthStateService {
  private _payload$ = new BehaviorSubject<JWTPayload | null>(null);
  public payload$ = this._payload$.asObservable();

  public readonly isAuthenticated$ = this.payload$.pipe(
    map(payload => Boolean(payload))
  );

  public setPayload(token: JWTPayload | null) {
    this._payload$.next(token);
  }

  public isAuthenticated() {
    return this._payload$.value != null
  }

  public getPartial<T extends keyof JWTPayload>(key: T): JWTPayload[T] | null {
    const payload = this._payload$.value
    if(!payload) return null
    return payload[key]
  }

  public clear() {
    this._payload$.next(null);
  }

  get payload(): JWTPayload | null {
    return this._payload$.value;
  }

  get expired(): boolean {
    if (!this._payload$.value?.exp) return true;
    return this._payload$.value.exp * 1000 < Date.now()
  }

  public decode(token: string): JWTPayload {
    return jwtDecode<JWTPayload>(token);
  }
}
