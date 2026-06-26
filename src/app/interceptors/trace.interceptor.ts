import { HttpInterceptorFn } from '@angular/common/http';
import { isApiUrl } from '../utils/api-url.util';

export const traceInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiUrl(req.url)) {
    return next(req);
  }

  const requestId = crypto.randomUUID();
  return next(req.clone({
    setHeaders: { 'X-Request-Id': requestId }
  }));
};
