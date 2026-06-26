import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const traceInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const requestId = crypto.randomUUID();
  return next(req.clone({
    setHeaders: { 'X-Request-Id': requestId }
  }));
};
