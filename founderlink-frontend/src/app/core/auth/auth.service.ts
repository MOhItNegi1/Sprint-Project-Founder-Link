import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap, throwError } from 'rxjs';
import { AuthResponse, LoginPayload, RegisterPayload, Role } from '../models/portal.models';

const TOKEN_KEY = 'founderlink.jwt';
const REFRESH_KEY = 'founderlink.refresh';
const SESSION_KEY = 'founderlink.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly sessionSignal = signal<AuthResponse | null>(this.readSession());

  readonly session = this.sessionSignal.asReadonly();
  readonly token = computed(() => this.sessionSignal()?.token ?? null);
  readonly userId = computed(() => this.sessionSignal()?.userId ?? null);
  readonly role = computed(() => this.sessionSignal()?.role ?? null);
  readonly email = computed(() => this.sessionSignal()?.email ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.token()));
  readonly isAdmin = computed(() => this.role() === 'ROLE_ADMIN');
  readonly isFounder = computed(() => this.role() === 'ROLE_FOUNDER');
  readonly isInvestor = computed(() => this.role() === 'ROLE_INVESTOR');

  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>('/auth/login', payload).pipe(tap((session) => this.persist(session)));
  }

  register(payload: RegisterPayload) {
    return this.http.post<AuthResponse>('/auth/register', payload);
  }

  refreshTokenRequest() {
    const refreshToken = this.sessionSignal()?.refreshToken;
    if (!refreshToken) return throwError(() => new Error('No refresh token'));
    return this.http.post<AuthResponse>('/auth/refresh', { refreshToken }).pipe(
      tap((session) => this.persist(session))
    );
  }

  logout(): void {
    const refreshToken = this.sessionSignal()?.refreshToken;
    this.clearLocalSession();
    if (refreshToken) {
      this.http.post('/auth/logout', { refreshToken }, { responseType: 'text' }).subscribe({ error: () => undefined });
    }
    this.router.navigateByUrl('/login');
  }

  hasRole(roles: Role[]): boolean {
    const role = this.role();
    return Boolean(role && roles.includes(role));
  }

  private persist(session: AuthResponse): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (session.token) localStorage.setItem(TOKEN_KEY, session.token);
    if (session.refreshToken) localStorage.setItem(REFRESH_KEY, session.refreshToken);
    this.sessionSignal.set(session);
  }

  private clearLocalSession(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
    this.sessionSignal.set(null);
  }

  private readSession(): AuthResponse | null {
    if (!this.isBrowser()) return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
