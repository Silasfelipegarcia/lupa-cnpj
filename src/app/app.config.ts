import { APP_BOOTSTRAP_LISTENER, ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { traceInterceptor } from './interceptors/trace.interceptor';
import { SeoTitleStrategy } from './services/seo-title.strategy';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRouterService } from './services/analytics-router.service';

function bootstrapAnalytics(): () => void {
  const analytics = inject(AnalyticsService);
  const routerAnalytics = inject(AnalyticsRouterService);
  return () => {
    analytics.initIfConsented();
    routerAnalytics.init();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([traceInterceptor, authInterceptor])),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    {
      provide: APP_BOOTSTRAP_LISTENER,
      multi: true,
      useFactory: bootstrapAnalytics
    },
    provideClientHydration(withEventReplay())
  ]
};
