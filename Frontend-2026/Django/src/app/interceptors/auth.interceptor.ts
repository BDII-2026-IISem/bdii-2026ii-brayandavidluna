import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth';

const retriedAfterRefresh = new HttpContextToken<boolean>(() => false);
const tokenEndpoints = [
  `${API_BASE_URL}/auth/login/`,
  `${API_BASE_URL}/auth/token/refresh/`,
  `${API_BASE_URL}/auth/logout/`,
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isApiRequest = req.url.startsWith(`${API_BASE_URL}/`);
  const isTokenEndpoint = tokenEndpoints.some((endpoint) => req.url.endsWith(endpoint));

  if (!isApiRequest || isTokenEndpoint) {
    return next(req);
  }

  const token = authService.getToken();
  if (!token) {
    return next(req);
  }

  const authorizedRequest = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        req.context.get(retriedAfterRefresh) ||
        !authService.getRefreshToken()
      ) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((accessToken) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${accessToken}` },
              context: req.context.set(retriedAfterRefresh, true),
            }),
          ).pipe(
            catchError((retryError: unknown) => {
              if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
                authService.clearSession();
              }
              return throwError(() => retryError);
            }),
          ),
        ),
      );
    }),
  );
};
