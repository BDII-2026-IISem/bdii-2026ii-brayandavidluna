import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth';
import { permissionGuard } from './permission.guard';

@Component({
  standalone: true,
  template: '',
})
class GuardTestComponent {}

describe('permissionGuard', () => {
  let router: Router;
  let authService: {
    restoreSession: ReturnType<typeof vi.fn>;
    hasPermission: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      restoreSession: vi.fn(() => of(true)),
      hasPermission: vi.fn(() => true),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'clients/:id',
            component: GuardTestComponent,
            canActivate: [permissionGuard],
            data: {
              permissions: [{ method: 'GET', path: '/api/v1/clients/<int:pk>/' }],
            },
          },
          { path: 'forbidden', component: GuardTestComponent },
          { path: 'login', component: GuardTestComponent },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('allows a route when the effective method and concrete path are granted', async () => {
    await router.navigateByUrl('/clients/42');

    expect(authService.hasPermission).toHaveBeenCalledWith('GET', '/api/v1/clients/42/');
    expect(router.url).toBe('/clients/42');
  });

  it('redirects to forbidden when the resource is not granted', async () => {
    authService.hasPermission.mockReturnValue(false);

    await router.navigateByUrl('/clients/42');

    expect(router.url).toBe('/forbidden');
  });

  it('rejects a non-numeric primary key', async () => {
    await router.navigateByUrl('/clients/not-a-number');

    expect(authService.hasPermission).not.toHaveBeenCalled();
    expect(router.url).toBe('/forbidden');
  });
});
