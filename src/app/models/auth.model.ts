export type UserRole = 'USER' | 'ADMIN';
export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO_PLUS';

export type SubscriptionStatusType = 'NONE' | 'ACTIVE' | 'CANCELLED_PENDING' | 'EXPIRED';

export interface SubscriptionInfo {
  status: SubscriptionStatusType;
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

export interface PlanUsage {
  maxRowsPerFile: number;
  maxBatchSearchesPerDay: number | null;
  maxDirectCnpjPerDay: number | null;
  batchSearchesToday: number;
  directCnpjToday: number;
  master: boolean;
  pesquisaRazaoSocial?: boolean;
  exportExcel?: boolean;
  filtroSomenteAtivos?: boolean;
  filtrosAvancados?: boolean;
  dedupeHabilitado?: boolean;
  trialDisponivel?: boolean;
  dadosLimitados?: boolean;
  maxImportJobsPerDay?: number | null;
  importJobsToday?: number;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  createdAt?: string;
  role?: UserRole;
  plan?: SubscriptionPlan;
  planNome?: string;
  usage?: PlanUsage;
  subscription?: SubscriptionInfo;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  cpf: string;
  password: string;
}

export interface ChangePasswordRequest {
  senhaAtual: string;
  senhaNova: string;
}

export interface PlanCatalogItem {
  plan?: SubscriptionPlan;
  nome: string;
  descricao?: string;
  maxRowsPerFile: number;
  batchSearchesPerDay: string;
  directCnpjPerDay: string;
  priceCents: number;
  priceLabel: string;
  beneficios?: string[];
  contatoComercial?: boolean;
}

export interface CheckoutRequest {
  plan: SubscriptionPlan;
}

export interface CheckoutResponse {
  orderId: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  amountCents?: number;
  amountLabel?: string;
  upgrade?: boolean;
}
