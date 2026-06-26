import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsRouterService } from '../../services/analytics-router.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (visible()) {
      <div class="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title" aria-live="polite">
        <div class="cookie-banner__inner">
          <div class="cookie-banner__text">
            <p id="cookie-banner-title" class="cookie-banner__title">Cookies e privacidade</p>
            <p class="cookie-banner__desc">
              Usamos armazenamento essencial para sessão, segurança e prevenção de abuso.
              Com seu consentimento, também usamos analytics para entender o uso do produto.
              Saiba mais na
              <a routerLink="/privacidade">Política de Privacidade</a>
              e na
              <a routerLink="/cookies">Política de Cookies</a>.
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
  private sub?: Subscription;

  readonly visible = signal(false);
  readonly showPreferences = signal(false);
  readonly analyticsPref = signal(true);

  ngOnInit(): void {
    this.visible.set(!this.consentService.hasDecided());
    this.sub = this.consentService.consent$.subscribe((state) => {
      this.visible.set(state === null);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  aceitar(): void {
    this.consentService.acceptAll();
    this.analytics.onConsentGranted();
    this.routerAnalytics.trackCurrentPage();
  }

  recusar(): void {
    this.consentService.rejectOptional();
    this.analytics.onConsentRevoked();
  }

  abrirPreferencias(): void {
    this.showPreferences.set(true);
    this.analyticsPref.set(true);
  }

  toggleAnalytics(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.analyticsPref.set(input.checked);
  }

  salvarPreferencias(): void {
    const enabled = this.analyticsPref();
    this.consentService.savePreferences(enabled);
    if (enabled) {
      this.analytics.onConsentGranted();
      this.routerAnalytics.trackCurrentPage();
    } else {
      this.analytics.onConsentRevoked();
    }
    this.showPreferences.set(false);
  }
}
