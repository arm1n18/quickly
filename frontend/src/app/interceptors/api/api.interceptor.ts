import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStorageService } from '../../services/auth/authStorageService/auth-storage.service';
import { switchMap, take } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStorageService);
  
  const apiUrl = 'http://localhost:3000/api';

  if (!req.url.startsWith('http')) {
    const apiReq = req.clone({
      url: `${apiUrl}${req.urlWithParams}`,
      setHeaders: {
        ...(auth.getToken() && {Authorization: `Bearer ${auth.getToken()}`})
      },
      withCredentials: true
    })
        console.log(auth.getToken())

    return next(apiReq);
  }
  
  return next(req);
};
