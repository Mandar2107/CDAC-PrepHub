import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, firstValueFrom, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'student' | 'admin';
export interface SessionUser { id: string; name: string; email: string; role: UserRole }
interface SessionResponse { accessToken: string; user: SessionUser }
export interface LoginPayload { email: string; password: string }
export interface RegisterPayload extends LoginPayload { name: string }

const API = environment.apiBaseUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<SessionUser | null>(null);
  readonly accessToken = signal<string | null>(null);
  private refreshRequest: Observable<SessionResponse> | null = null;

  login(payload: LoginPayload): Observable<SessionUser> {
    if (environment.devDashboardPreview) {
      const account = environment.demoAccounts.find((candidate) => candidate.email === payload.email.trim().toLowerCase() && candidate.password === payload.password);
      if (account) {
        const user: SessionUser = { id: account.id, name: account.name, email: account.email, role: account.role };
        this.user.set(user);
        this.accessToken.set('development-preview-token');
        return of(user);
      }
    }
    return this.http.post<SessionResponse>(`${API}/auth/login`, payload, { withCredentials: true }).pipe(map((session) => this.apply(session)));
  }

  register(payload: RegisterPayload): Observable<SessionUser> {
    return this.http.post<SessionResponse>(`${API}/auth/register`, payload, { withCredentials: true }).pipe(map((session) => this.apply(session)));
  }

  async ensureSession(): Promise<boolean> {
    if (this.user()) return true;
    return firstValueFrom(this.refreshSession());
  }

  refreshSession(): Observable<boolean> {
    const request = this.refreshRequest ?? (this.refreshRequest = this.http.post<SessionResponse>(`${API}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap((session) => this.apply(session)),
      finalize(() => { this.refreshRequest = null; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    ));
    return request.pipe(map(() => true), catchError(() => { this.clear(); return of(false); }));
  }

  async logout(): Promise<void> {
    if (this.accessToken() === 'development-preview-token') { this.clear(); return; }
    try { await firstValueFrom(this.http.post<void>(`${API}/auth/logout`, {}, { withCredentials: true })); }
    finally { this.clear(); }
  }

  private apply(session: SessionResponse): SessionUser {
    this.user.set(session.user);
    this.accessToken.set(session.accessToken);
    return session.user;
  }

  private clear(): void {
    this.user.set(null);
    this.accessToken.set(null);
  }
}
