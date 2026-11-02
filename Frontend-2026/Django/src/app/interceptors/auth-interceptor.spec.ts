import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { AuthService } from '../services/auth';
import { authInterceptor } from './auth.interceptor';
import { of } from 'rxjs';

describe('authInterceptor', () => {
  it('adds a bearer token when a session exists', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { getToken: () => 'test-access-token' },
        },
      ],
    });

    const request = new HttpRequest('GET', '/api/v1/clients/');
    const next = vi.fn((forwarded: HttpRequest<unknown>) => {
      expect(forwarded.headers.get('Authorization')).toBe(
        'Bearer test-access-token',
      );
      return of(new HttpResponse());
    });

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, next),
    ).subscribe();

    expect(next).toHaveBeenCalledOnce();
  });
});
