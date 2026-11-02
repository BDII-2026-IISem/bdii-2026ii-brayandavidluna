import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth';

interface RoutePermission {
  method: string;
  path: string;
}

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requirements = route.data['permissions'] as RoutePermission[] | undefined;

  if (!requirements?.length) {
    return router.createUrlTree(['/forbidden']);
  }

  const unresolved = requirements.some(
    (permission) =>
      permission.path.includes('<int:pk>') && !route.paramMap.get('id')?.match(/^[0-9]+$/),
  );
  if (unresolved) {
    return router.createUrlTree(['/forbidden']);
  }

  return authService.restoreSession().pipe(
    map((authenticated) => {
      if (!authenticated) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        });
      }

      const allowed = requirements.every((permission) => {
        const path = permission.path.replace('<int:pk>', route.paramMap.get('id') ?? '');
        return authService.hasPermission(permission.method, path);
      });

      return allowed ? true : router.createUrlTree(['/forbidden']);
    }),
    catchError((error: unknown) => {
      const authError =
        error instanceof HttpErrorResponse && error.status === 403
          ? 'El usuario no tiene permisos para consultar su perfil.'
          : 'No se pudo validar la sesión con el servidor.';
      return of(router.createUrlTree(['/login'], { queryParams: { authError } }));
    }),
  );
};
