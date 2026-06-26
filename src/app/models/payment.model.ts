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
}

export interface ChargePlanRequest {
  plan: 'PREMIUM' | 'PRO_PLUS';
  cardId?: string;
  securityCode?: string;
  token?: string;
}

export interface ChargePlanResponse {
  orderId: string;
  status: string;
  statusLabel: string;
  planNome: string;
}

export interface SubscriptionStatusResponse {
  status: string;
  plan?: 'PREMIUM' | 'PRO_PLUS' | 'FREE';
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
  plan: 'PREMIUM' | 'PRO_PLUS';
  amountCents: number;
  amountLabel: string;
  fullPriceCents: number;
  fullPriceLabel: string;
  upgrade: boolean;
  description?: string;
}
