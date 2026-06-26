import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  AnalyticsEventName,
  AnalyticsEventParams,
  FunnelId,
  RouteAnalyticsConfig
} from '../models/analytics.model';
import { SubscriptionPlan } from '../models/auth.model';
import { AnalyticsFlowService } from './analytics-flow.service';
import { CookieConsentService } from './cookie-consent.service';

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  FREE: 'free',
  PREMIUM: 'prospeccao',
  PRO_PLUS: 'growth'
};

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly flowService = inject(AnalyticsFlowService);
  private readonly consentService = inject(CookieConsentService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly apiUrl = `${environment.apiUrl}/analytics/event`;
  private readonly measurementId = environment.gaMeasurementId;
  private initialized = false;
  private currentUserId: string | null = null;
  private currentPlanTier: string | null = null;

  init(): void {
    if (!this.isBrowser || !this.measurementId || this.initialized || !this.consentService.hasAnalyticsConsent()) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag(...args: unknown[]): void {
        window.dataLayer.push(args);
      };
    }

    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    this.loadGtagScript().then(() => {
      window.gtag('js', new Date());
      window.gtag('config', this.measurementId, {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: this.gtagCookieFlags()
      });
      this.initialized = true;
    }).catch((error) => {
      if (!environment.production) {
        console.warn('[analytics] falha ao carregar gtag', error);
      }
    });
  }

  initIfConsented(): void {
    this.init();
  }

  onConsentGranted(): void {
    this.init();
  }

  onConsentRevoked(): void {
    // Mantém sessão e funcionalidades essenciais; apenas deixa de enviar novos eventos analíticos.
  }

  pageView(path: string, title: string, routeConfig?: RouteAnalyticsConfig): void {
    const params: AnalyticsEventParams = {
      page_path: path,
      page_title: title,
      page_location: `${environment.siteUrl}${path === '/' ? '' : path}`,
      flow_id: this.flowService.getFlowId()
    };

    this.send('page_view', params);

    if (routeConfig) {
      this.funnelStep(routeConfig.funnel, routeConfig.step, routeConfig.stepName, {
        page_path: path
      });
    }
  }

  funnelStep(
    funnelId: FunnelId,
    step: number,
    stepName: string,
    extra?: AnalyticsEventParams
  ): void {
    this.send('funnel_step', {
      funnel_id: funnelId,
      funnel_step: step,
      funnel_step_name: stepName,
      flow_id: this.flowService.getFlowId(),
      plan_tier: this.currentPlanTier ?? undefined,
      ...extra
    });
  }

  setUser(userId: string, plan?: SubscriptionPlan): void {
    this.currentUserId = userId;
    if (plan) {
      this.currentPlanTier = PLAN_LABELS[plan] ?? plan.toLowerCase();
    }

    if (!this.isBrowser || !this.measurementId || !this.initialized || !this.consentService.hasAnalyticsConsent()) {
      return;
    }

    window.gtag('config', this.measurementId, { user_id: userId });
    window.gtag('set', 'user_properties', {
      plan_tier: this.currentPlanTier ?? 'unknown'
    });
  }

  clearUser(): void {
    this.currentUserId = null;
    this.currentPlanTier = null;
  }

  trackGuestPreview(cnpjDigits: string): void {
    this.send('guest_cnpj_preview', {
      funnel_id: 'acquisition',
      funnel_step: 2,
      funnel_step_name: 'guest_cnpj_preview',
      cnpj_length: cnpjDigits.length
    });
  }

  trackSignUpStart(): void {
    this.send('signup_form_start', {
      funnel_id: 'acquisition',
      funnel_step: 3,
      funnel_step_name: 'signup_form_submit'
    });
  }

  trackSignUp(userId: string, plan?: SubscriptionPlan): void {
    this.setUser(userId, plan);
    this.send('sign_up', {
      funnel_id: 'acquisition',
      funnel_step: 4,
      funnel_step_name: 'signup_complete',
      method: 'email'
    });
  }

  trackSignUpError(errorCode: string): void {
    this.send('sign_up_error', {
      funnel_id: 'acquisition',
      funnel_step: 3,
      funnel_step_name: 'signup_form_submit',
      error_code: errorCode
    });
  }

  trackLogin(userId: string, plan?: SubscriptionPlan): void {
    this.setUser(userId, plan);
    this.send('login', {
      funnel_id: 'acquisition',
      funnel_step: 4,
      funnel_step_name: 'login_complete',
      method: 'email'
    });
  }

  trackLoginError(errorCode: string): void {
    this.send('login_error', {
      funnel_id: 'acquisition',
      funnel_step: 2,
      funnel_step_name: 'login_form_submit',
      error_code: errorCode
    });
  }

  trackFirstImport(jobId: string, fileName: string): void {
    this.send('first_import', {
      funnel_id: 'activation',
      funnel_step: 2,
      funnel_step_name: 'first_import_complete',
      job_id: jobId,
      file_name: fileName
    });
  }

  trackExport(format: string, jobId: string): void {
    this.send('export_results', {
      funnel_id: 'activation',
      funnel_step: 3,
      funnel_step_name: 'export_complete',
      export_format: format,
      job_id: jobId
    });
  }

  trackBeginCheckout(plan: SubscriptionPlan): void {
    this.send('begin_checkout', {
      funnel_id: 'monetization',
      funnel_step: 2,
      funnel_step_name: 'plan_selected',
      plan_code: plan,
      plan_tier: PLAN_LABELS[plan]
    });
  }

  trackCheckoutRedirect(plan: SubscriptionPlan, orderId: string): void {
    this.send('checkout_redirect', {
      funnel_id: 'monetization',
      funnel_step: 3,
      funnel_step_name: 'mercadopago_redirect',
      plan_code: plan,
      plan_tier: PLAN_LABELS[plan],
      transaction_id: orderId
    });
  }

  trackTrialStart(plan: SubscriptionPlan = 'PREMIUM'): void {
    this.send('start_trial', {
      funnel_id: 'monetization',
      funnel_step: 3,
      funnel_step_name: 'trial_started',
      plan_code: plan,
      plan_tier: PLAN_LABELS[plan]
    });
  }

  trackPurchase(planNome: string, plan: SubscriptionPlan, transactionId?: string, valueCents?: number): void {
    const params: AnalyticsEventParams = {
      funnel_id: 'monetization',
      funnel_step: 5,
      funnel_step_name: planNome,
      plan_code: plan,
      plan_tier: PLAN_LABELS[plan],
      transaction_id: transactionId
    };

    if (valueCents != null) {
      params.value = valueCents / 100;
      params.currency = 'BRL';
    }

    this.send('purchase', params);
    this.currentPlanTier = PLAN_LABELS[plan];
  }

  trackPurchasePending(plan: SubscriptionPlan, transactionId?: string): void {
    this.send('purchase_pending', {
      funnel_id: 'monetization',
      funnel_step: 5,
      funnel_step_name: 'payment_pending',
      plan_code: plan,
      plan_tier: PLAN_LABELS[plan],
      transaction_id: transactionId
    });
  }

  trackPurchaseError(errorCode: string, plan?: SubscriptionPlan): void {
    this.send('purchase_error', {
      funnel_id: 'monetization',
      funnel_step: 4,
      funnel_step_name: 'payment_failed',
      plan_code: plan,
      plan_tier: plan ? PLAN_LABELS[plan] : undefined,
      error_code: errorCode
    });
  }

  trackSaveList(jobId: string, listName: string): void {
    this.send('save_list', {
      funnel_id: 'retention',
      funnel_step: 2,
      funnel_step_name: 'list_saved',
      job_id: jobId,
      list_name: listName
    });
  }

  trackReprocess(sourceJobId: string, newJobId: string): void {
    this.send('reprocess_list', {
      funnel_id: 'retention',
      funnel_step: 2,
      funnel_step_name: 'list_reprocessed',
      job_id: sourceJobId,
      new_job_id: newJobId
    });
  }

  trackCtaClick(name: string, location: string): void {
    this.send('cta_click', {
      cta_name: name,
      cta_location: location,
      flow_id: this.flowService.getFlowId()
    });
  }

  private send(event: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
    if (!this.consentService.hasAnalyticsConsent()) {
      return;
    }

    const enriched: AnalyticsEventParams = {
      ...params,
      flow_id: params.flow_id ?? this.flowService.getFlowId(),
      plan_tier: params.plan_tier ?? this.currentPlanTier ?? undefined
    };

    const backendPayload: AnalyticsEventParams = {
      ...enriched,
      user_id: this.currentUserId ?? undefined
    };
    this.sendToBackend(event, backendPayload);

    if (event === 'purchase') {
      this.sendPurchaseToGa4(enriched);
      return;
    }

    this.sendToGa4(event, enriched);
  }

  private sendPurchaseToGa4(params: AnalyticsEventParams): void {
    if (!this.isBrowser || !this.measurementId || !this.consentService.hasAnalyticsConsent()) {
      return;
    }
    if (!this.initialized) {
      this.init();
      if (!window.gtag) {
        return;
      }
    }

    const gaParams = this.toGa4Params(params) as Record<string, unknown>;
    if (params.plan_code) {
      gaParams['items'] = [{
        item_id: params.plan_code,
        item_name: params.funnel_step_name ?? params.plan_code,
        price: params.value
      }];
    }
    window.gtag('event', 'purchase', gaParams);
  }

  private sendToBackend(event: AnalyticsEventName, params: AnalyticsEventParams): void {
    if (!this.isBrowser) {
      return;
    }

    const properties = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    );

    this.http.post(this.apiUrl, {
      event,
      properties: JSON.stringify(properties)
    }, { responseType: 'text' }).subscribe({
      error: (error) => {
        if (!environment.production) {
          console.warn('[analytics] falha ao enviar evento para API', { event, error });
        }
      }
    });
  }

  private sendToGa4(event: AnalyticsEventName, params: AnalyticsEventParams): void {
    if (!this.isBrowser || !this.measurementId || !this.consentService.hasAnalyticsConsent()) {
      return;
    }

    if (!this.initialized) {
      this.init();
      if (!window.gtag) {
        return;
      }
    }

    const gaParams = this.toGa4Params(params);
    window.gtag('event', event, gaParams);
  }

  private toGa4Params(params: AnalyticsEventParams): Record<string, string | number | boolean> {
    const ga: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') {
        continue;
      }
      const gaKey = key.length > 40 ? key.slice(0, 40) : key;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        ga[gaKey] = value;
      }
    }

    return ga;
  }

  private loadGtagScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${this.measurementId}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('gtag script failed to load'));
      document.head.appendChild(script);
    });
  }

  private gtagCookieFlags(): string {
    return window.location.protocol === 'https:' ? 'SameSite=None;Secure' : 'SameSite=Lax';
  }
}
