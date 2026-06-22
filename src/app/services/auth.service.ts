import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { AuthStorage } from './auth-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiBase = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<User | null>(AuthStorage.recuperarUsuario());

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return AuthStorage.recuperarToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
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

  logout(): void {
    AuthStorage.limpar();
    this.currentUser.set(null);
  }

  private persistirSessao(response: AuthResponse): void {
    AuthStorage.salvarToken(response.token);
    AuthStorage.salvarUsuario(response.user);
    this.currentUser.set(response.user);
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    const mensagem = error.error?.erro || 'Erro ao autenticar';
    return throwError(() => mensagem);
  }
}
