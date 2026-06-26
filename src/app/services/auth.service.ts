import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { LogoutReason } from '../models/analytics.model';
import { AuthStorage } from './auth-storage';
import { AnalyticsService } from './analytics.service';
import { getJwtExpirationMs, isJwtExpired } from '../utils/jwt.util';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiBase = `${environment.apiUrl}/auth`;
  private readonly analytics = inject(AnalyticsService);

  readonly currentUser = signal<User | null>(AuthStorage.recuperarUsuario());

  private expiryTimer?: ReturnType<typeof setTimeout>;
  private visibilityListener?: () => void;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.configurarMonitoramentoSessao();
  }

  getToken(): string | null {
    return AuthStorage.recuperarToken();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    if (!this.sessaoCompativelComApi()) {
      this.logout();
      return false;
    }
    if (isJwtExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  sessaoCompativelComApi(): boolean {
    const apiSalva = AuthStorage.recuperarApiUrl();
    if (!apiSalva) {
      return false;
    }
    return apiSalva === environment.apiUrl;
  }

  temSessaoExpirada(): boolean {
    const token = this.getToken();
    return !!token && isJwtExpired(token);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/login`, request).pipe(
      tap((response) => this.persistirSessao(response)),
      catchError(this.tratarErro)
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/register`, request).pipe(
      tap((response) => this.persistirSessao(response)),
      catchError(this.tratarErro)
    );
  }

  carregarPerfil(): Observable<User> {
    return this.http.get<User>(`${this.apiBase}/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        AuthStorage.salvarUsuario(user);
      }),
      catchError(this.tratarErro)
    );
  }

  refreshMe(): Observable<User> {
    return this.carregarPerfil();
  }

  alterarSenha(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/password`, request).pipe(
      catchError(this.tratarErro)
    );
  }

  isMaster(): boolean {
    return this.currentUser()?.usage?.master === true || this.currentUser()?.role === 'ADMIN';
  }

  planoAtual(): string {
    const user = this.currentUser();
    return user?.planNome || 'Free';
  }

  logout(reason?: LogoutReason): void {
    if (reason) {
      this.analytics.trackLogout(reason);
    }
    this.cancelarAgendamento();
    AuthStorage.limpar();
    this.currentUser.set(null);
    this.analytics.clearUser();
  }

  logoutPorExpiracao(): void {
    if (!this.getToken()) {
      return;
    }
    this.logout('session_expired');
    this.router.navigate(['/login'], {
      queryParams: { sessaoExpirada: '1' }
    });
  }

  logoutPorAmbienteDiferente(): void {
    this.logout('environment_mismatch');
    this.router.navigate(['/login'], {
      queryParams: { ambiente: '1' }
    });
  }

  verificarSessaoAtiva(): boolean {
    if (!this.temSessaoExpirada()) {
      this.agendarLogoutPorExpiracao();
      return true;
    }
    this.logoutPorExpiracao();
    return false;
  }

  private configurarMonitoramentoSessao(): void {
    const token = this.getToken();
    const user = AuthStorage.recuperarUsuario();

    if (user && !token) {
      this.logout();
      return;
    }

    if (token && !this.sessaoCompativelComApi()) {
      this.logoutPorAmbienteDiferente();
      return;
    }

    if (token && isJwtExpired(token)) {
      this.logout();
      return;
    }
    if (token) {
      this.agendarLogoutPorExpiracao();
      const storedUser = AuthStorage.recuperarUsuario();
      if (storedUser) {
        this.analytics.setUser(storedUser.id, storedUser.plan);
      }
    }

    if (typeof document !== 'undefined') {
      this.visibilityListener = () => {
        if (document.visibilityState === 'visible' && this.getToken()) {
          this.verificarSessaoAtiva();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityListener);
    }
  }

  private agendarLogoutPorExpiracao(): void {
    this.cancelarAgendamento();

    const token = this.getToken();
    if (!token) {
      return;
    }

    const expirationMs = getJwtExpirationMs(token);
    if (expirationMs === null) {
      this.logoutPorExpiracao();
      return;
    }

    const delayMs = expirationMs - Date.now();
    if (delayMs <= 0) {
      this.logoutPorExpiracao();
      return;
    }

    this.expiryTimer = setTimeout(() => this.logoutPorExpiracao(), delayMs);
  }

  private cancelarAgendamento(): void {
    if (this.expiryTimer !== undefined) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = undefined;
    }
  }

  private persistirSessao(response: AuthResponse): void {
    AuthStorage.salvarToken(response.token, environment.apiUrl);
    AuthStorage.salvarUsuario(response.user);
    this.currentUser.set(response.user);
    this.analytics.setUser(response.user.id, response.user.plan);
    this.agendarLogoutPorExpiracao();
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    const body = error.error;
    if (body && typeof body === 'object' && typeof body.erro === 'string') {
      return throwError(() => body.erro);
    }
    if (error.status === 0) {
      return throwError(() => 'Sem conexão com a API. Verifique sua rede e tente novamente.');
    }
    if (error.status === 404) {
      return throwError(() =>
        'API indisponível (404). Na Vercel, remova API_URL ou use /api e confira o proxy em vercel.json.'
      );
    }
    return throwError(() => 'Erro ao autenticar');
  }
}
