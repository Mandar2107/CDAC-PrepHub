import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(`${environment.apiBaseUrl}/`)) return next(request);
  const auth = inject(AuthService);
  const headers = auth.accessToken() ? request.headers.set('Authorization', `Bearer ${auth.accessToken()}`) : request.headers;
  const authenticated = request.clone({ headers, withCredentials: true });
  if (/\/auth\/(login|register|refresh)$/.test(request.url)) return next(authenticated);
  return next(authenticated).pipe(catchError((error: unknown) => {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);
    return auth.refreshSession().pipe(switchMap((refreshed) => {
      if (!refreshed || !auth.accessToken()) return throwError(() => error);
      return next(authenticated.clone({ setHeaders: { Authorization: `Bearer ${auth.accessToken()}` } }));
    }));
  }));
};
