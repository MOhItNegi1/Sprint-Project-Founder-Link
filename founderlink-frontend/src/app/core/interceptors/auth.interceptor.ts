import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  
  if (request.url.includes('/auth/refresh')) {
    return next(request);
  }

  const token = auth.token();
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return auth.refreshTokenRequest().pipe(
          switchMap((session) => {
             const newReq = request.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } });
             return next(newReq);
          }),
          catchError((refreshError) => {
             auth.logout();
             return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
