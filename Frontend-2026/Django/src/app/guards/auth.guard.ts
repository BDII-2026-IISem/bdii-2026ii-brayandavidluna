import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.restoreSession().pipe(
    map((authenticated) =>
      authenticated
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
    catchError((error: unknown) => {
      const authError =
        error instanceof HttpErrorResponse && error.status === 403
          ? 'El usuario no tiene permisos para consultar su perfil.'
          : 'No se pudo validar la sesión con el servidor.';
      return of(router.createUrlTree(['/login'], { queryParams: { authError } }));
    }),
  );
};
