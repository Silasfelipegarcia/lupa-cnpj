import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ChargePlanRequest,
  ChargePlanResponse,
  PaymentConfig,
  PaymentHistoryItem,
  PlanQuote,
  SavedCard,
  SubscriptionStatusResponse
} from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private readonly apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obterConfig(): Observable<PaymentConfig> {
    return this.http.get<PaymentConfig>(`${this.apiBase}/payments/config`).pipe(
      catchError(this.tratarErro)
    );
  }

  listarHistorico(): Observable<PaymentHistoryItem[]> {
    return this.http.get<PaymentHistoryItem[]>(`${this.apiBase}/payments/history`).pipe(
      catchError(this.tratarErro)
    );
  }

  listarCartoes(): Observable<SavedCard[]> {
    return this.http.get<SavedCard[]>(`${this.apiBase}/payments/cards`).pipe(
      catchError(this.tratarErro)
    );
  }

  salvarCartao(token: string): Observable<SavedCard> {
    return this.http.post<SavedCard>(`${this.apiBase}/payments/cards`, { token }).pipe(
      catchError(this.tratarErro)
    );
  }

  removerCartao(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/payments/cards/${cardId}`).pipe(
      catchError(this.tratarErro)
    );
  }

  cobrarPlano(body: ChargePlanRequest, idempotencyKey?: string): Observable<ChargePlanResponse> {
    const headers = idempotencyKey
      ? { 'Idempotency-Key': idempotencyKey }
      : undefined;
    return this.http.post<ChargePlanResponse>(`${this.apiBase}/payments/charge`, body, { headers }).pipe(
      catchError(this.tratarErro)
    );
  }

  obterCotacao(plan: 'PREMIUM' | 'PRO_PLUS'): Observable<PlanQuote> {
    return this.http.get<PlanQuote>(`${this.apiBase}/payments/quote`, { params: { plan } }).pipe(
      catchError(this.tratarErro)
    );
  }

  obterAssinatura(): Observable<SubscriptionStatusResponse> {
    return this.http.get<SubscriptionStatusResponse>(`${this.apiBase}/payments/subscription`).pipe(
      catchError(this.tratarErro)
    );
  }

  cancelarAssinatura(): Observable<SubscriptionStatusResponse> {
    return this.http.post<SubscriptionStatusResponse>(`${this.apiBase}/payments/subscription/cancel`, {}).pipe(
      catchError(this.tratarErro)
    );
  }

  reativarAssinatura(): Observable<SubscriptionStatusResponse> {
    return this.http.post<SubscriptionStatusResponse>(`${this.apiBase}/payments/subscription/reactivate`, {}).pipe(
      catchError(this.tratarErro)
    );
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    const mensagem = error.error?.erro || error.error?.message || error.message || 'Erro ao processar pagamento';
    return throwError(() => mensagem);
  }
}
