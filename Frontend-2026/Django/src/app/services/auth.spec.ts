import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService, EffectivePermission, UserProfile } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const tokens = { access: 'access-token', refresh: 'refresh-token' };
  const profile: UserProfile = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'ClimaTec',
    roles: ['ADMIN'],
    createdAt: '2026-11-02T10:00:00Z',
  };
  const permissions: EffectivePermission[] = [
    {
      method: 'GET',
      path: '/api/v1/clients/',
      roleId: 1,
      roleName: 'ADMIN',
    },
    {
      method: 'PATCH',
      path: '/api/v1/clients/<int:pk>/',
      roleId: 1,
      roleName: 'ADMIN',
    },
  ];

  beforeEach(() => {
    localStorage.removeItem('climatec_access_token');
    localStorage.removeItem('climatec_refresh_token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('waits for the backend profile before completing login', async () => {
    const login = firstValueFrom(service.login({ username: 'admin', password: 'secret' }));

    const loginRequest = http.expectOne('/api/v1/auth/login/');
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.headers.has('Authorization')).toBe(false);
    loginRequest.flush(tokens);

    const profileRequest = http.expectOne('/api/v1/auth/me/');
    expect(profileRequest.request.headers.get('Authorization')).toBe('Bearer access-token');
    profileRequest.flush(profile);
    http.expectOne('/api/v1/auth/permissions/').flush({ permissions });

    await expect(login).resolves.toEqual(profile);
    expect(service.currentUser()).toEqual(profile);
    expect(service.effectivePermissions()).toEqual(permissions);
    expect(service.getToken()).toBe(tokens.access);
    expect(service.getRefreshToken()).toBe(tokens.refresh);
  });

  it('clears tokens if loading the profile fails after login', async () => {
    const login = firstValueFrom(service.login({ username: 'admin', password: 'secret' }));
    http.expectOne('/api/v1/auth/login/').flush(tokens);
    http.expectOne('/api/v1/auth/permissions/').flush({ permissions });
    http.expectOne('/api/v1/auth/me/').flush({}, { status: 403, statusText: 'Forbidden' });

    await expect(login).rejects.toBeDefined();
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('restores a saved session by loading the profile', async () => {
    localStorage.setItem('climatec_access_token', 'saved-access');
    localStorage.setItem('climatec_refresh_token', 'saved-refresh');

    const restore = firstValueFrom(service.restoreSession());
    const request = http.expectOne('/api/v1/auth/me/');
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-access');
    request.flush(profile);
    http.expectOne('/api/v1/auth/permissions/').flush({ permissions });

    await expect(restore).resolves.toBe(true);
    expect(service.currentUser()).toEqual(profile);
    expect(service.effectivePermissions()).toEqual(permissions);
  });

  it('does not mark authorization as loaded when permission retrieval fails', async () => {
    localStorage.setItem('climatec_access_token', 'saved-access');
    localStorage.setItem('climatec_refresh_token', 'saved-refresh');

    const restore = firstValueFrom(service.restoreSession());
    http.expectOne('/api/v1/auth/me/').flush(profile);
    http.expectOne('/api/v1/auth/permissions/').flush({}, { status: 403, statusText: 'Forbidden' });

    await expect(restore).rejects.toBeDefined();
    expect(service.authorizationLoaded()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.effectivePermissions()).toEqual([]);
  });

  it('matches effective permissions by method and numeric route parameters', () => {
    service.effectivePermissions.set(permissions);

    expect(service.hasPermission('get', '/api/v1/clients/')).toBe(true);
    expect(service.hasPermission('PATCH', '/api/v1/clients/42/')).toBe(true);
    expect(service.hasPermission('PATCH', '/api/v1/clients/not-a-number/')).toBe(false);
    expect(service.hasPermission('DELETE', '/api/v1/clients/42/')).toBe(false);
    expect(service.hasPermission('PATCH', '/api/v1/clients/42/extra/')).toBe(false);
  });

  it('clears effective permissions with the local session', () => {
    service.effectivePermissions.set(permissions);

    service.clearSession();

    expect(service.effectivePermissions()).toEqual([]);
  });

  it('stores rotated tokens returned by the refresh endpoint', async () => {
    localStorage.setItem('climatec_access_token', 'expired-access');
    localStorage.setItem('climatec_refresh_token', 'old-refresh');

    const refresh = firstValueFrom(service.refreshAccessToken());
    const request = http.expectOne('/api/v1/auth/token/refresh/');
    expect(request.request.body).toEqual({ refresh: 'old-refresh' });
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ access: 'new-access', refresh: 'new-refresh' });

    await expect(refresh).resolves.toBe('new-access');
    expect(service.getToken()).toBe('new-access');
    expect(service.getRefreshToken()).toBe('new-refresh');
  });

  it('shares one refresh request for concurrent 401 responses', async () => {
    localStorage.setItem('climatec_access_token', 'expired-access');
    localStorage.setItem('climatec_refresh_token', 'old-refresh');

    const clientsResult = firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/clients/'));
    const equipmentResult = firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/equipment/'));
    const failedClientsRequest = http.expectOne('/api/v1/clients/');
    const failedEquipmentRequest = http.expectOne('/api/v1/equipment/');
    expect(failedClientsRequest.request.headers.get('Authorization')).toBe('Bearer expired-access');
    expect(failedEquipmentRequest.request.headers.get('Authorization')).toBe(
      'Bearer expired-access',
    );
    failedClientsRequest.flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );
    failedEquipmentRequest.flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    const refreshRequest = http.expectOne('/api/v1/auth/token/refresh/');
    refreshRequest.flush({ access: 'new-access', refresh: 'new-refresh' });

    const retriedClientsRequest = http.expectOne('/api/v1/clients/');
    const retriedEquipmentRequest = http.expectOne('/api/v1/equipment/');
    expect(retriedClientsRequest.request.headers.get('Authorization')).toBe('Bearer new-access');
    expect(retriedEquipmentRequest.request.headers.get('Authorization')).toBe('Bearer new-access');
    retriedClientsRequest.flush([]);
    retriedEquipmentRequest.flush([]);

    await expect(Promise.all([clientsResult, equipmentResult])).resolves.toEqual([[], []]);
    expect(service.getRefreshToken()).toBe('new-refresh');
  });

  it('does not retry more than once when the refreshed token is rejected', async () => {
    localStorage.setItem('climatec_access_token', 'expired-access');
    localStorage.setItem('climatec_refresh_token', 'old-refresh');

    const requestResult = firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/clients/'));
    http.expectOne('/api/v1/clients/').flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('/api/v1/auth/token/refresh/')
      .flush({ access: 'new-access', refresh: 'new-refresh' });
    http.expectOne('/api/v1/clients/').flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(requestResult).rejects.toBeDefined();
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('clears local tokens after a failed remote logout', async () => {
    localStorage.setItem('climatec_access_token', 'access-token');
    localStorage.setItem('climatec_refresh_token', 'refresh-token');

    const logout = firstValueFrom(service.logout());
    const request = http.expectOne('/api/v1/auth/logout/');
    expect(request.request.body).toEqual({ refresh: 'refresh-token' });
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ detail: 'Token inválido.' }, { status: 400, statusText: 'Bad Request' });

    await expect(logout).rejects.toBeDefined();
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('does not send the access token to non-API origins', async () => {
    localStorage.setItem('climatec_access_token', 'access-token');
    const requestResult = firstValueFrom(
      TestBed.inject(HttpClient).get('https://example.com/data'),
    );
    const request = http.expectOne('https://example.com/data');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ ok: true });

    await expect(requestResult).resolves.toEqual({ ok: true });
  });
});
