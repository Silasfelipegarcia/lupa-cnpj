/** Identificadores estáveis dos funis — use os mesmos nomes no GA4 Explorations. */
export type FunnelId = 'acquisition' | 'monetization' | 'activation' | 'retention';

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
  | 'signup_form_start'
  | 'sign_up'
  | 'sign_up_error'
  | 'login'
  | 'login_error'
  | 'first_import'
  | 'import_error'
  | 'export_results'
  | 'pricing_view'
  | 'begin_checkout'
  | 'checkout_redirect'
  | 'start_trial'
  | 'purchase'
  | 'purchase_pending'
  | 'purchase_error'
  | 'save_list'
  | 'reprocess_list'
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
  value?: number;
  currency?: string;
  transaction_id?: string;
  [key: string]: string | number | boolean | undefined;
}

/** Mapeamento rota → passo do funil (page_view + funnel_step automáticos). */
export const ROUTE_ANALYTICS: Record<string, RouteAnalyticsConfig> = {
  '': { funnel: 'acquisition', step: 1, stepName: 'landing_view' },
  login: { funnel: 'acquisition', step: 2, stepName: 'login_form_view' },
  cadastro: { funnel: 'acquisition', step: 3, stepName: 'signup_form_view' },
  app: { funnel: 'activation', step: 1, stepName: 'import_dashboard_view' },
  planos: { funnel: 'monetization', step: 1, stepName: 'pricing_view' },
  'planos/sucesso': { funnel: 'monetization', step: 5, stepName: 'payment_success_view' },
  'planos/pendente': { funnel: 'monetization', step: 5, stepName: 'payment_pending_view' },
  historico: { funnel: 'retention', step: 1, stepName: 'history_view' },
  conta: { funnel: 'retention', step: 1, stepName: 'account_view' }
};
