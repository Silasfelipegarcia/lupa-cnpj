import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  AnalyticsEventName,
  AnalyticsEventParams,
  FunnelId,
  LogoutReason,
  RouteAnalyticsConfig
} from '../models/analytics.model';
import { SubscriptionPlan } from '../models/auth.model';
import { AnalyticsFlowService } from './analytics-flow.service';
import { CookieConsentService } from './cookie-consent.service';
import { sanitizeAnalyticsError } from '../utils/analytics-error.util';

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
      // Deve usar `arguments` (padrão Google). `push([...args])` quebra o processamento do gtag.js.
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments);
      };
    }

    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    // js + config devem rodar antes dos eventos (padrão Google); o script carrega em paralelo.
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      cookie_flags: this.gtagCookieFlags()
    });
    this.initialized = true;

    this.loadGtagScript().then(() => {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
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
    this.funnelEvent('guest_cnpj_preview', 'acquisition', 2, 'guest_cnpj_preview', {
      cnpj_length: cnpjDigits.length
    });
  }

  trackGuestPreviewError(errorCode: string): void {
    this.funnelEvent('guest_cnpj_preview_error', 'acquisition', 2, 'guest_cnpj_preview', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackSignUpStart(): void {
    this.funnelEvent('signup_form_start', 'acquisition', 3, 'signup_form_submit');
  }

  trackSignUp(userId: string, plan?: SubscriptionPlan): void {
    this.setUser(userId, plan);
    this.funnelEvent('sign_up', 'acquisition', 4, 'signup_complete', { method: 'email' });
  }

  trackSignUpError(errorCode: string): void {
    this.funnelEvent('sign_up_error', 'acquisition', 3, 'signup_form_submit', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackLoginFormStart(): void {
    this.funnelEvent('login_form_start', 'acquisition', 2, 'login_form_submit');
  }

  trackLogin(userId: string, plan?: SubscriptionPlan): void {
    this.setUser(userId, plan);
    this.funnelEvent('login', 'acquisition', 4, 'login_complete', { method: 'email' });
  }

  trackLoginError(errorCode: string): void {
    this.funnelEvent('login_error', 'acquisition', 2, 'login_form_submit', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackSessionExpiredView(): void {
    this.funnelEvent('session_expired_view', 'retention', 1, 'session_expired_view');
  }

  trackLogout(reason: LogoutReason): void {
    this.send('logout', {
      funnel_id: 'retention',
      funnel_step: 3,
      funnel_step_name: 'logout',
      logout_reason: reason
    });
  }

  trackConsentGranted(): void {
    this.send('consent_granted', {
      funnel_id: 'acquisition',
      funnel_step: 0,
      funnel_step_name: 'consent_banner',
      consent_analytics: true
    });
  }

  trackConsentRejected(): void {
    this.send('consent_rejected', {
      funnel_id: 'acquisition',
      funnel_step: 0,
      funnel_step_name: 'consent_banner',
      consent_analytics: false
    });
  }

  trackConsentPreferencesSaved(analyticsEnabled: boolean): void {
    this.send('consent_preferences_saved', {
      funnel_id: 'acquisition',
      funnel_step: 0,
      funnel_step_name: 'consent_preferences',
      consent_analytics: analyticsEnabled
    });
  }

  trackConsentPreferencesOpen(): void {
    this.send('consent_preferences_open', {
      funnel_id: 'acquisition',
      funnel_step: 0,
      funnel_step_name: 'consent_preferences'
    });
  }

  trackOnboardingDismissed(): void {
    this.funnelEvent('onboarding_dismissed', 'activation', 1, 'onboarding_dismissed');
  }

  trackFirstImport(jobId: string, fileName: string): void {
    this.funnelEvent('first_import', 'activation', 2, 'import_complete', {
      job_id: jobId,
      file_name: fileName
    });
  }

  trackImportError(errorCode: string): void {
    this.funnelEvent('import_error', 'activation', 2, 'import_failed', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackImportValidationError(errorCode: string): void {
    this.funnelEvent('import_validation_error', 'activation', 2, 'import_validation_failed', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackDownloadTemplate(): void {
    this.funnelEvent('download_template', 'activation', 1, 'download_template');
  }

  trackResumeJob(jobId: string, source: string): void {
    this.funnelEvent('resume_job', 'activation', 2, 'resume_job', {
      job_id: jobId,
      source
    });
  }

  trackCancelImport(jobId: string, source: string): void {
    this.funnelEvent('cancel_import', 'activation', 2, 'cancel_import', {
      job_id: jobId,
      source
    });
  }

  trackCancelImportError(jobId: string, errorCode: string, source: string): void {
    this.funnelEvent('cancel_import_error', 'activation', 2, 'cancel_import_failed', {
      job_id: jobId,
      source,
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackCnpjDirectLookup(cnpjLength: number): void {
    this.funnelEvent('cnpj_direct_lookup', 'activation', 2, 'cnpj_direct_lookup', {
      cnpj_length: cnpjLength
    });
  }

  trackCnpjDirectLookupError(errorCode: string): void {
    this.funnelEvent('cnpj_direct_lookup_error', 'activation', 2, 'cnpj_direct_lookup_failed', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackNotificationPermissionRequest(granted: boolean): void {
    this.funnelEvent('notification_permission_request', 'activation', 2, 'notification_permission', {
      permission_granted: granted
    });
  }

  trackApplyFilters(jobId: string, filterCount: number): void {
    this.funnelEvent('apply_filters', 'activation', 3, 'apply_filters', {
      job_id: jobId,
      filter_count: filterCount
    });
  }

  trackExport(format: string, jobId: string, filterCount = 0): void {
    this.funnelEvent('export_results', 'activation', 3, 'export_complete', {
      export_format: format,
      job_id: jobId,
      filter_count: filterCount
    });
  }

  trackExportError(jobId: string, errorCode: string): void {
    this.funnelEvent('export_error', 'activation', 3, 'export_failed', {
      job_id: jobId,
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackBeginCheckout(plan: SubscriptionPlan): void {
    this.funnelEvent('begin_checkout', 'monetization', 2, 'plan_selected', {
      plan_code: plan,
      plan_tier: PLAN_LABELS[plan]
    });
  }

  trackCheckoutRedirect(plan: SubscriptionPlan, orderId: string): void {
    this.funnelEvent('checkout_redirect', 'monetization', 3, 'mercadopago_redirect', {
      plan_code: plan,
      plan_tier: PLAN_LABELS[plan],
      transaction_id: orderId
    });
  }

  trackTrialStart(plan: SubscriptionPlan = 'PREMIUM'): void {
    this.funnelEvent('start_trial', 'monetization', 3, 'trial_started', {
      plan_code: plan,
      plan_tier: PLAN_LABELS[plan]
    });
  }

  trackTrialError(errorCode: string): void {
    this.funnelEvent('trial_error', 'monetization', 3, 'trial_failed', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackTrialCardPromptView(): void {
    this.funnelEvent('trial_card_prompt_view', 'monetization', 3, 'trial_card_prompt');
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
    this.funnelEvent('purchase_error', 'monetization', 4, 'payment_failed', {
      plan_code: plan,
      plan_tier: plan ? PLAN_LABELS[plan] : undefined,
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackPurchaseSyncError(errorCode: string): void {
    this.funnelEvent('purchase_sync_error', 'monetization', 5, 'payment_sync_failed', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackBeginCardRegister(): void {
    this.funnelEvent('begin_card_register', 'monetization', 3, 'card_register_start');
  }

  trackCardSaved(): void {
    this.funnelEvent('card_saved', 'monetization', 3, 'card_saved');
  }

  trackCardRegisterError(errorCode: string): void {
    this.funnelEvent('card_register_error', 'monetization', 3, 'card_register_failed', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackCardRemoved(): void {
    this.funnelEvent('card_removed', 'monetization', 3, 'card_removed');
  }

  trackCardRemovedError(errorCode: string): void {
    this.funnelEvent('card_removed_error', 'monetization', 3, 'card_removed_failed', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackSubscriptionCancel(): void {
    this.funnelEvent('subscription_cancel', 'monetization', 4, 'subscription_cancelled');
  }

  trackSubscriptionReactivate(): void {
    this.funnelEvent('subscription_reactivate', 'monetization', 4, 'subscription_reactivated');
  }

  trackSubscriptionError(errorCode: string, action: string): void {
    this.funnelEvent('subscription_error', 'monetization', 4, 'subscription_action_failed', {
      error_code: sanitizeAnalyticsError(errorCode),
      action
    });
  }

  trackSaveList(jobId: string, listName: string): void {
    this.funnelEvent('save_list', 'retention', 2, 'list_saved', {
      job_id: jobId,
      list_name: listName
    });
  }

  trackSaveListError(jobId: string, errorCode: string): void {
    this.funnelEvent('save_list_error', 'retention', 2, 'list_save_failed', {
      job_id: jobId,
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackReprocess(sourceJobId: string, newJobId: string): void {
    this.funnelEvent('reprocess_list', 'retention', 2, 'list_reprocessed', {
      job_id: sourceJobId,
      new_job_id: newJobId
    });
  }

  trackReprocessError(jobId: string, errorCode: string): void {
    this.funnelEvent('reprocess_error', 'retention', 2, 'reprocess_failed', {
      job_id: jobId,
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackViewJobDetail(jobId: string, source: string): void {
    this.funnelEvent('view_job_detail', 'retention', 2, 'view_job_detail', {
      job_id: jobId,
      source
    });
  }

  trackViewSavedList(jobId: string): void {
    this.funnelEvent('view_saved_list', 'retention', 2, 'view_saved_list', {
      job_id: jobId
    });
  }

  trackPasswordChange(): void {
    this.funnelEvent('password_change', 'retention', 2, 'password_changed');
  }

  trackPasswordChangeError(errorCode: string): void {
    this.funnelEvent('password_change_error', 'retention', 2, 'password_change_failed', {
      error_code: sanitizeAnalyticsError(errorCode)
    });
  }

  trackCtaClick(name: string, location: string): void {
    this.send('cta_click', {
      cta_name: name,
      cta_location: location,
      flow_id: this.flowService.getFlowId()
    });
  }

  private funnelEvent(
    event: AnalyticsEventName,
    funnel: FunnelId,
    step: number,
    stepName: string,
    extra: AnalyticsEventParams = {}
  ): void {
    this.send(event, {
      funnel_id: funnel,
      funnel_step: step,
      funnel_step_name: stepName,
      ...extra
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
        console.warn('[analytics] falha ao enviar evento para API', { event, error });
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
