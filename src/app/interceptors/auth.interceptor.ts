import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
import { isJwtExpired } from '../utils/jwt.util';

const PUBLIC_API_SEGMENTS = [
  '/auth/login',
  '/auth/register',
  '/cnpj/preview',
  '/plans',
  '/payments/mercadopago/webhook',
  '/analytics/event'
];

function isPublicApi(url: string): boolean {
  return PUBLIC_API_SEGMENTS.some((segment) => url.includes(segment));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isApiCall = req.url.startsWith(environment.apiUrl);
  const isPublic = isPublicApi(req.url);
  const token = authService.getToken();

  if (isApiCall && token && !isPublic) {
    if (!authService.sessaoCompativelComApi()) {
      authService.logoutPorAmbienteDiferente();
      return throwError(() => new Error('Sessão de outro ambiente'));
    }
    if (isJwtExpired(token)) {
      authService.logoutPorExpiracao();
      return throwError(() => new Error('Sessão expirada'));
    }

    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isApiCall && !isPublic) {
        authService.logoutPorExpiracao();
      }
      return throwError(() => error);
    })
  );
};
