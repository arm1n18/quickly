import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import { AuthService } from '../../services/auth/authService/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const auth = inject(AuthService);

  const addToken = (req: any, token: string | null) =>
    req.clone({
      setHeaders: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
  });

  return auth.getValidToken().pipe(
    switchMap(token =>
      next(addToken(req, token))
    )
  );
};
