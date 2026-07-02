import type { SubscriptionPlan } from './auth.model';

export interface PaymentConfig {
  publicKey: string;
  configured: boolean;
}

export interface PaymentHistoryItem {
  id: string;
  planNome: string;
  amountLabel: string;
  status: string;
  statusLabel: string;
  createdAt: string;
}

export interface SavedCard {
  id: string;
  brand: string;
  lastFourDigits: string;
  expirationMonth: string;
  expirationYear: string;
  holderName: string;
  defaultCard?: boolean;
}

export const CHECKOUT_ORDER_STORAGE_KEY = 'lupa_checkout_order';

export interface CheckoutSyncResponse {
  status: string;
  statusLabel: string;
  planNome: string;
  orderId: string;
}

export interface CheckoutSyncRequest {
  paymentId?: string;
  externalReference?: string;
  preferenceId?: string;
  orderId?: string;
}

export interface ChargePlanRequest {
  plan: SubscriptionPlan;
  cardId?: string;
  securityCode?: string;
  token?: string;
  installments?: number;
}

export interface ChargePlanResponse {
  orderId: string;
  status: string;
  statusLabel: string;
  planNome: string;
}

export interface SubscriptionStatusResponse {
  status: string;
  plan?: SubscriptionPlan;
  planNome?: string;
  validUntil?: string;
  cancelledAt?: string;
  autoRenew: boolean;
  daysRemaining: number;
  defaultCardId?: string;
  podeCancelar: boolean;
  podeReativar: boolean;
}

export interface PlanQuote {
  plan: SubscriptionPlan;
  amountCents: number;
  amountLabel: string;
  fullPriceCents: number;
  fullPriceLabel: string;
  monthlyPriceCents?: number;
  annualPriceCents?: number;
  installments?: number;
  installmentAmountLabel?: string;
  upgrade: boolean;
  description?: string;
}
