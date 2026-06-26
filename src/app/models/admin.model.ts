import { SubscriptionPlan, UserRole } from './auth.model';

export interface AdminUsageSnapshot {
  batchSearches: number;
  directCnpjLookups: number;
  total: number;
}

export interface AdminPlanCount {
  plan: SubscriptionPlan;
  count: number;
}

export interface AdminOverview {
  periodDays: number;
  totalUsers: number;
  newUsersInPeriod: number;
  usersByPlan: AdminPlanCount[];
  activeTrials: number;
  activePaidSubscriptions: number;
  totalRevenueCents: number;
  revenueInPeriodCents: number;
  approvedPaymentsInPeriod: number;
  pendingPayments: number;
  totalImportJobs: number;
  activeImportJobs: number;
  totalRowsProcessed: number;
  totalRowsSuccess: number;
  totalRowsErrors: number;
  usageInPeriod: AdminUsageSnapshot;
  usageToday: AdminUsageSnapshot;
}

export interface AdminUserSummary {
  id: string;
  nome: string;
  email: string;
  plan: SubscriptionPlan;
  role: UserRole;
  createdAt: string;
  enabled: boolean;
  importJobsCount: number;
  rowsProcessed: number;
  revenueCents: number;
  usageToday: AdminUsageSnapshot;
}

export interface AdminUsersPage {
  content: AdminUserSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminImportJobSummary {
  id: string;
  arquivo: string;
  status: string;
  total: number;
  processados: number;
  sucesso: number;
  erros: number;
  createdAt: string;
  completedAt?: string;
}

export interface AdminPaymentSummary {
  id: string;
  plan: SubscriptionPlan;
  status: string;
  amountCents: number;
  createdAt: string;
  paidAt?: string;
  renewal: boolean;
}

export interface AdminDailyUsage {
  date: string;
  batchSearches: number;
  directCnpjLookups: number;
}

export interface AdminUserDetail {
  id: string;
  nome: string;
  email: string;
  plan: SubscriptionPlan;
  role: UserRole;
  createdAt: string;
  enabled: boolean;
  trialUtilizado: boolean;
  trialAte?: string;
  planValidUntil?: string;
  planCancelledAt?: string;
  autoRenew: boolean;
  importJobsCount: number;
  rowsProcessed: number;
  rowsSuccess: number;
  rowsErrors: number;
  revenueCents: number;
  usageLifetime: AdminUsageSnapshot;
  usageLast30Days: AdminUsageSnapshot;
  recentImports: AdminImportJobSummary[];
  payments: AdminPaymentSummary[];
  dailyUsage: AdminDailyUsage[];
}

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  FREE: 'Free',
  PREMIUM: 'Prospecção',
  PRO_PLUS: 'Growth'
};
