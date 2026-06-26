import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsRouterService } from '../../services/analytics-router.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [RouterLink, AnalyticsCtaDirective],
  template: `
    @if (ready() && visible()) {
      <div class="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title" aria-live="polite">
        <div class="cookie-banner__inner">
          <div class="cookie-banner__text">
            <p id="cookie-banner-title" class="cookie-banner__title">Cookies e privacidade</p>
            <p class="cookie-banner__desc">
              Usamos armazenamento essencial para sessão, segurança e prevenção de abuso.
              Com seu consentimento, também usamos analytics para entender o uso do produto.
              Saiba mais na
              <a routerLink="/privacidade" appAnalyticsCta="privacidade" appAnalyticsCtaLocation="cookie_banner">Política de Privacidade</a>
              e na
              <a routerLink="/cookies" appAnalyticsCta="cookies" appAnalyticsCtaLocation="cookie_banner">Política de Cookies</a>.
            </p>
            @if (showPreferences()) {
              <label class="cookie-pref">
                <input type="checkbox" [checked]="analyticsPref()" (change)="toggleAnalytics($event)" />
                <span>Permitir cookies analíticos (Google Analytics)</span>
              </label>
            }
          </div>
          <div class="cookie-banner__actions">
            @if (showPreferences()) {
              <button type="button" class="btn btn-outline btn-sm" (click)="salvarPreferencias()">
                Salvar preferências
              </button>
            } @else {
              <button type="button" class="btn btn-outline btn-sm" (click)="abrirPreferencias()">
                Gerenciar
              </button>
              <button type="button" class="btn btn-outline btn-sm" (click)="recusar()">
                Recusar opcionais
              </button>
              <button type="button" class="btn btn-primary btn-sm" (click)="aceitar()">
                Aceitar todos
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './cookie-consent.component.scss'
})
export class CookieConsentComponent implements OnInit, OnDestroy {
  private readonly consentService = inject(CookieConsentService);
  private readonly analytics = inject(AnalyticsService);
  private readonly routerAnalytics = inject(AnalyticsRouterService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private sub?: Subscription;

  readonly ready = signal(false);
  readonly visible = signal(false);
  readonly showPreferences = signal(false);
  readonly analyticsPref = signal(true);

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.consentService.syncFromStorage();
    this.ready.set(true);
    this.refreshVisibility();
    this.sub = this.consentService.consent$.subscribe(() => {
      this.refreshVisibility();
    });
  }

  private refreshVisibility(): void {
    this.visible.set(!this.consentService.hasDecided());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  aceitar(): void {
    this.consentService.acceptAll();
    this.analytics.trackConsentGranted();
    this.analytics.onConsentGranted();
    this.routerAnalytics.trackCurrentPage();
  }

  recusar(): void {
    this.consentService.rejectOptional();
    this.analytics.trackConsentRejected();
    this.analytics.onConsentRevoked();
  }

  abrirPreferencias(): void {
    this.showPreferences.set(true);
    this.analyticsPref.set(true);
    this.analytics.trackConsentPreferencesOpen();
  }

  toggleAnalytics(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.analyticsPref.set(input.checked);
  }

  salvarPreferencias(): void {
    const enabled = this.analyticsPref();
    this.consentService.savePreferences(enabled);
    this.analytics.trackConsentPreferencesSaved(enabled);
    if (enabled) {
      this.analytics.onConsentGranted();
      this.routerAnalytics.trackCurrentPage();
    } else {
      this.analytics.onConsentRevoked();
    }
    this.showPreferences.set(false);
  }
}
