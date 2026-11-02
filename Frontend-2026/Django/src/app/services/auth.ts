import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { EffectivePermission } from '../models/rbac';

export type { EffectivePermission } from '../models/rbac';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${API_BASE_URL}/auth`;
  private readonly tokenKey = 'climatec_access_token';
  private readonly refreshKey = 'climatec_refresh_token';
  private refreshRequest: Observable<string> | null = null;

  readonly currentUser = signal<UserProfile | null>(null);
  readonly effectivePermissions = signal<EffectivePermission[]>([]);
  readonly authorizationLoaded = signal(false);

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<UserProfile> {
    return this.http.post<AuthTokens>(`${this.apiUrl}/login/`, credentials).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      switchMap(() => this.loadAuthorizationContext()),
      map(({ user }) => user),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
    );
  }

  loadUserProfile(): Observable<UserProfile> {
    return this.http
      .get<UserProfile>(`${this.apiUrl}/me/`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  loadEffectivePermissions(): Observable<EffectivePermission[]> {
    return this.http
      .get<{ permissions: EffectivePermission[] }>(`${this.apiUrl}/permissions/`)
      .pipe(
        map((response) => response.permissions),
        tap((permissions) => this.effectivePermissions.set(permissions)),
      );
  }

  hasPermission(method: string, requestPath: string): boolean {
    return this.effectivePermissions().some(
      (permission) =>
        permission.method === method.toUpperCase() &&
        this.pathMatches(permission.path, requestPath),
    );
  }

  private loadAuthorizationContext(): Observable<{
    user: UserProfile;
    permissions: EffectivePermission[];
  }> {
    return forkJoin({
      user: this.http.get<UserProfile>(`${this.apiUrl}/me/`),
      permissionResponse: this.http.get<{ permissions: EffectivePermission[] }>(
        `${this.apiUrl}/permissions/`,
      ),
    }).pipe(
      map(({ user, permissionResponse }) => ({
        user,
        permissions: permissionResponse.permissions,
      })),
      tap(({ user, permissions }) => {
        this.currentUser.set(user);
        this.effectivePermissions.set(permissions);
        this.authorizationLoaded.set(true);
      }),
    );
  }

  restoreSession(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      return of(false);
    }

    if (this.authorizationLoaded()) {
      return of(true);
    }

    return this.loadAuthorizationContext().pipe(map(() => true));
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshRequest) {
      return this.refreshRequest;
    }

    const refresh = this.getRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('No hay un refresh token disponible.'));
    }

    this.refreshRequest = this.http
      .post<AuthTokens>(`${this.apiUrl}/token/refresh/`, { refresh })
      .pipe(
        tap((tokens) => this.storeTokens(tokens)),
        map((tokens) => tokens.access),
        catchError((error: unknown) => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshRequest = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshRequest;
  }

  logout(): Observable<void> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      this.clearSession();
      return of(void 0);
    }

    return this.http.post<unknown>(`${this.apiUrl}/logout/`, { refresh }).pipe(
      map(() => void 0),
      finalize(() => this.clearSession()),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    this.currentUser.set(null);
    this.effectivePermissions.set([]);
    this.authorizationLoaded.set(false);
  }

  private storeTokens(tokens: AuthTokens): void {
    if (!tokens?.access || !tokens.refresh) {
      throw new Error('La API no devolvió el par de tokens esperado.');
    }

    localStorage.setItem(this.tokenKey, tokens.access);
    localStorage.setItem(this.refreshKey, tokens.refresh);
  }

  private pathMatches(resourcePath: string, requestPath: string): boolean {
    const resourceSegments = resourcePath.split('/');
    const requestSegments = requestPath.split('/');
    if (resourceSegments.length !== requestSegments.length) {
      return false;
    }

    return resourceSegments.every((segment, index) =>
      segment === '<int:pk>'
        ? /^[0-9]+$/.test(requestSegments[index])
        : segment === requestSegments[index],
    );
  }
}
