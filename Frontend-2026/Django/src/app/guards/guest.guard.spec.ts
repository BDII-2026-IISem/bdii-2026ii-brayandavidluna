import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth';
import { guestGuard } from './guest.guard';

@Component({
  standalone: true,
  template: '',
})
class GuardTestComponent {}

describe('guestGuard', () => {
  let router: Router;
  let authService: { restoreSession: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { restoreSession: vi.fn(() => of(false)) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: GuardTestComponent, canActivate: [guestGuard] },
          { path: '', component: GuardTestComponent },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('allows unauthenticated users to open login', async () => {
    await router.navigateByUrl('/login');

    expect(router.url).toBe('/login');
  });

  it('redirects users with an active session to the application', async () => {
    authService.restoreSession.mockReturnValue(of(true));

    await router.navigateByUrl('/login');

    expect(router.url).toBe('/');
  });
});
