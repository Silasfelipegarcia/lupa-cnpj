/** Identificadores estáveis dos funis — use os mesmos nomes no GA4 Explorations. */
export type FunnelId = 'acquisition' | 'monetization' | 'activation' | 'retention';

export type LogoutReason = 'manual' | 'session_expired' | 'environment_mismatch';

export interface RouteAnalyticsConfig {
  funnel: FunnelId;
  step: number;
  stepName: string;
}

/** Eventos de conversão e micro-conversões do produto. */
export type AnalyticsEventName =
  | 'page_view'
  | 'funnel_step'
  | 'guest_cnpj_preview'
  | 'guest_cnpj_preview_error'
  | 'landing_view'
  | 'cnpj_search'
  | 'result_view'
  | 'signup'
  | 'checkout_started'
  | 'purchase_completed'
  | 'signup_form_start'
  | 'sign_up'
  | 'sign_up_error'
  | 'login_form_start'
  | 'login'
  | 'login_error'
  | 'session_expired_view'
  | 'logout'
  | 'consent_granted'
  | 'consent_rejected'
  | 'consent_preferences_saved'
  | 'consent_preferences_open'
  | 'onboarding_dismissed'
  | 'first_import'
  | 'import_error'
  | 'import_validation_error'
  | 'download_template'
  | 'resume_job'
  | 'cancel_import'
  | 'cancel_import_error'
  | 'cnpj_direct_lookup'
  | 'cnpj_direct_lookup_error'
  | 'notification_permission_request'
  | 'apply_filters'
  | 'export_results'
  | 'export_error'
  | 'pricing_view'
  | 'begin_checkout'
  | 'checkout_redirect'
  | 'start_trial'
  | 'trial_error'
  | 'purchase'
  | 'purchase_pending'
  | 'purchase_error'
  | 'purchase_sync_error'
  | 'begin_card_register'
  | 'card_saved'
  | 'card_register_error'
  | 'card_removed'
  | 'card_removed_error'
  | 'trial_card_prompt_view'
  | 'subscription_cancel'
  | 'subscription_reactivate'
  | 'subscription_error'
  | 'save_list'
  | 'save_list_error'
  | 'reprocess_list'
  | 'reprocess_error'
  | 'view_job_detail'
  | 'view_saved_list'
  | 'password_change'
  | 'password_change_error'
  | 'password_reset_request'
  | 'password_reset_request_success'
  | 'password_reset_request_error'
  | 'password_reset_complete'
  | 'password_reset_complete_error'
  | 'cta_click';

export interface AnalyticsEventParams {
  funnel_id?: FunnelId;
  funnel_step?: number;
  funnel_step_name?: string;
  flow_id?: string;
  plan_tier?: string;
  plan_code?: string;
  job_id?: string;
  export_format?: string;
  cta_name?: string;
  cta_location?: string;
  error_code?: string;
  logout_reason?: LogoutReason;
  consent_analytics?: boolean;
  value?: number;
  currency?: string;
  transaction_id?: string;
  [key: string]: string | number | boolean | undefined;
}

/** Mapeamento rota → passo do funil (page_view + funnel_step automáticos). */
export const ROUTE_ANALYTICS: Record<string, RouteAnalyticsConfig> = {
  '': { funnel: 'acquisition', step: 1, stepName: 'landing_view' },
  'consulta-cnpj': { funnel: 'acquisition', step: 1, stepName: 'landing_view' },
  login: { funnel: 'acquisition', step: 2, stepName: 'login_form_view' },
  cadastro: { funnel: 'acquisition', step: 3, stepName: 'signup_form_view' },
  'esqueci-senha': { funnel: 'acquisition', step: 2, stepName: 'forgot_password_view' },
  'redefinir-senha': { funnel: 'acquisition', step: 2, stepName: 'reset_password_view' },
  'cadastro-pendente': { funnel: 'acquisition', step: 3, stepName: 'signup_pending_view' },
  'verificar-email': { funnel: 'acquisition', step: 4, stepName: 'verify_email_view' },
  app: { funnel: 'activation', step: 1, stepName: 'import_dashboard_view' },
  'consulta/:jobId': { funnel: 'activation', step: 2, stepName: 'consulta_job_view' },
  planos: { funnel: 'monetization', step: 1, stepName: 'pricing_view' },
  'planos/sucesso': { funnel: 'monetization', step: 5, stepName: 'payment_success_view' },
  'planos/pendente': { funnel: 'monetization', step: 5, stepName: 'payment_pending_view' },
  historico: { funnel: 'retention', step: 1, stepName: 'history_view' },
  'historico/:jobId': { funnel: 'retention', step: 2, stepName: 'history_detail_view' },
  conta: { funnel: 'retention', step: 1, stepName: 'account_view' },
  'conta/perfil': { funnel: 'retention', step: 2, stepName: 'account_profile_view' },
  'conta/plano': { funnel: 'retention', step: 2, stepName: 'account_plan_view' },
  'conta/cobranca': { funnel: 'retention', step: 2, stepName: 'account_billing_view' },
  privacidade: { funnel: 'acquisition', step: 99, stepName: 'legal_privacy_view' },
  cookies: { funnel: 'acquisition', step: 99, stepName: 'legal_cookies_view' },
  termos: { funnel: 'acquisition', step: 99, stepName: 'legal_terms_view' }
};
