import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, ChangePasswordRequest, ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, RegisterRequest, RegisterResponse, ResendVerificationResponse, ResetPasswordRequest, User } from '../models/auth.model';
import { LogoutReason } from '../models/analytics.model';
import { AuthStorage } from './auth-storage';
import { AnalyticsService } from './analytics.service';
import { CnpjImportService } from './cnpj-import.service';
import { getJwtExpirationMs, isJwtExpired } from '../utils/jwt.util';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiBase = `${environment.apiUrl}/auth`;
  private readonly analytics = inject(AnalyticsService);
  private readonly cnpjImportService = inject(CnpjImportService);

  readonly currentUser = signal<User | null>(AuthStorage.recuperarUsuario());

  /** Reativo para templates — evita UI duplicada após hidratação SSR. */
  readonly isLoggedIn = computed(() => {
    const user = this.currentUser();
    const token = this.getToken();
    if (!user || !token) {
      return false;
    }
    if (!this.sessaoCompativelComApi()) {
      return false;
    }
    return !isJwtExpired(token);
  });

  private expiryTimer?: ReturnType<typeof setTimeout>;
  private expiryInterval?: ReturnType<typeof setInterval>;
  private visibilityListener?: () => void;
  private pageshowListener?: (event: PageTransitionEvent) => void;
  private refreshInFlight?: Observable<User>;
  private lastRefreshAt = 0;
  private expiryLogoutInProgress = false;
  private static readonly MIN_REFRESH_MS = 30_000;
  private static readonly SESSION_CHECK_MS = 60_000;

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
    if (!this.isLoggedIn()) {
      const token = this.getToken();
      if (token) {
        if (!this.sessaoCompativelComApi()) {
          this.logout();
        } else if (isJwtExpired(token)) {
          this.logout();
        }
      }
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

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiBase}/register`, request).pipe(
      catchError(this.tratarErro)
    );
  }

  verificarEmail(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBase}/verify-email`, { token }).pipe(
      tap((response) => this.persistirSessao(response)),
      catchError(this.tratarErro)
    );
  }

  reenviarVerificacao(email: string): Observable<string> {
    return this.http.post<ResendVerificationResponse>(`${this.apiBase}/resend-verification`, { email }).pipe(
      map((response) => response.mensagem),
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

  refreshMe(force = false): Observable<User> {
    const now = Date.now();
    if (!force && this.refreshInFlight) {
      return this.refreshInFlight;
    }
    if (!force && now - this.lastRefreshAt < AuthService.MIN_REFRESH_MS && this.currentUser()) {
      return of(this.currentUser()!);
    }

    this.refreshInFlight = this.carregarPerfil().pipe(
      tap(() => {
        this.lastRefreshAt = Date.now();
      }),
      finalize(() => {
        this.refreshInFlight = undefined;
      }),
      shareReplay(1)
    );
    return this.refreshInFlight;
  }

  alterarSenha(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/password`, request).pipe(
      catchError(this.tratarErro)
    );
  }

  solicitarResetSenha(email: string): Observable<string> {
    const body: ForgotPasswordRequest = { email };
    return this.http.post<ForgotPasswordResponse>(`${this.apiBase}/forgot-password`, body).pipe(
      map((response) => response.mensagem),
      catchError(this.tratarErro)
    );
  }

  redefinirSenha(token: string, senhaNova: string): Observable<void> {
    const body: ResetPasswordRequest = { token, senhaNova };
    return this.http.post<void>(`${this.apiBase}/reset-password`, body).pipe(
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
    this.lastRefreshAt = 0;
    this.cnpjImportService.invalidarCache('all');
    this.analytics.clearUser();
  }

  logoutPorExpiracao(): void {
    if (!this.getToken() && !this.currentUser()) {
      return;
    }
    if (this.expiryLogoutInProgress) {
      return;
    }
    this.expiryLogoutInProgress = true;
    this.logout('session_expired');
    void this.router.navigate(['/login'], {
      queryParams: { sessaoExpirada: '1' }
    }).finally(() => {
      this.expiryLogoutInProgress = false;
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
      this.logoutPorExpiracao();
      return;
    }
    if (token) {
      this.agendarLogoutPorExpiracao();
      this.iniciarVerificacaoPeriodica();
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

    if (typeof window !== 'undefined') {
      this.pageshowListener = (event: PageTransitionEvent) => {
        if (event.persisted && this.getToken()) {
          this.verificarSessaoAtiva();
        }
      };
      window.addEventListener('pageshow', this.pageshowListener);
    }
  }

  private iniciarVerificacaoPeriodica(): void {
    if (typeof window === 'undefined' || this.expiryInterval !== undefined) {
      return;
    }

    this.expiryInterval = setInterval(() => {
      if (this.getToken() && isJwtExpired(this.getToken()!)) {
        this.logoutPorExpiracao();
      }
    }, AuthService.SESSION_CHECK_MS);
  }

  private pararVerificacaoPeriodica(): void {
    if (this.expiryInterval !== undefined) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = undefined;
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
    this.pararVerificacaoPeriodica();
  }

  private persistirSessao(response: AuthResponse): void {
    AuthStorage.salvarToken(response.token, environment.apiUrl);
    AuthStorage.salvarUsuario(response.user);
    this.currentUser.set(response.user);
    this.analytics.setUser(response.user.id, response.user.plan);
    this.agendarLogoutPorExpiracao();
    this.iniciarVerificacaoPeriodica();
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
