import { HttpInterceptorFn } from '@angular/common/http';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = 'http://localhost:3000/api';

  if (!req.url.startsWith('http')) {
    const apiReq = req.clone({
      url: `${apiUrl}${req.urlWithParams}`
    })
    return next(apiReq);
  }
  
  return next(req);
};
