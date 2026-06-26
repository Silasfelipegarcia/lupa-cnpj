import { APP_BOOTSTRAP_LISTENER, ApplicationConfig, EnvironmentInjector, PLATFORM_ID, afterNextRender, inject, provideZoneChangeDetection, runInInjectionContext } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { traceInterceptor } from './interceptors/trace.interceptor';
import { SeoTitleStrategy } from './services/seo-title.strategy';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRouterService } from './services/analytics-router.service';
import { CookieConsentService } from './services/cookie-consent.service';

function bootstrapAnalytics(): () => void {
  const analytics = inject(AnalyticsService);
  const routerAnalytics = inject(AnalyticsRouterService);
  const consentService = inject(CookieConsentService);
  const platformId = inject(PLATFORM_ID);
  const injector = inject(EnvironmentInjector);

  return () => {
    if (!isPlatformBrowser(platformId)) {
      return;
    }

    runInInjectionContext(injector, () => {
      afterNextRender(() => {
        consentService.syncFromStorage();
        analytics.initIfConsented();
        routerAnalytics.init();
        if (consentService.hasAnalyticsConsent()) {
          routerAnalytics.trackCurrentPage();
        }
      });
    });
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
