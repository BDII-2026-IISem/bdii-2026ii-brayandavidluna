import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { authGuard } from './auth.guard';

@Component({
  standalone: true,
  template: '',
})
class GuardTestComponent {}

describe('authGuard', () => {
  let router: Router;
  let authService: { restoreSession: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { restoreSession: vi.fn(() => of(true)) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'clients',
            component: GuardTestComponent,
            canActivate: [authGuard],
          },
          { path: 'login', component: GuardTestComponent },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('allows navigation after the saved session is restored', async () => {
    await router.navigateByUrl('/clients');

    expect(authService.restoreSession).toHaveBeenCalledOnce();
    expect(router.url).toBe('/clients');
  });

  it('redirects anonymous navigation to login and preserves its return URL', async () => {
    authService.restoreSession.mockReturnValue(of(false));
    await router.navigateByUrl('/clients');

    expect(router.url).toBe('/login?returnUrl=%2Fclients');
  });

  it('redirects to login with a clear message when profile validation fails', async () => {
    authService.restoreSession.mockReturnValue(
      throwError(() => new Error('profile unavailable')),
    );
    await router.navigateByUrl('/clients');

    expect(router.url).toBe(
      '/login?authError=No%20se%20pudo%20validar%20la%20sesi%C3%B3n%20con%20el%20servidor.',
    );
  });
});
