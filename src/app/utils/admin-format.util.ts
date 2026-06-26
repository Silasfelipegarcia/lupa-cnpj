import { SubscriptionPlan } from '../models/auth.model';
import { PLAN_LABELS } from '../models/admin.model';

export function formatBrlFromCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatAdminDate(iso?: string): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatAdminDateTime(iso?: string): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function planLabel(plan: SubscriptionPlan): string {
  return PLAN_LABELS[plan] ?? plan;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}
