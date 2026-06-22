export type UserRole = 'USER' | 'ADMIN';
export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO_PLUS';

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
}

export interface User {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  role?: UserRole;
  plan?: SubscriptionPlan;
  planNome?: string;
  usage?: PlanUsage;
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
}
