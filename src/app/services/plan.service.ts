import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CheckoutRequest, CheckoutResponse, PlanCatalogItem, SubscriptionPlan, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class PlanService {

  private readonly apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarCatalogo(): Observable<PlanCatalogItem[]> {
    return this.http.get<PlanCatalogItem[]>(`${this.apiBase}/plans`).pipe(
      catchError(this.tratarErro)
    );
  }

  iniciarCheckout(plan: SubscriptionPlan, idempotencyKey?: string, installments = 1): Observable<CheckoutResponse> {
    const body: CheckoutRequest = { plan, installments };
    const headers = idempotencyKey
      ? { 'Idempotency-Key': idempotencyKey }
      : undefined;
    return this.http.post<CheckoutResponse>(`${this.apiBase}/payments/checkout`, body, { headers }).pipe(
      catchError(this.tratarErro)
    );
  }

  iniciarTrial(): Observable<User> {
    return this.http.post<User>(`${this.apiBase}/payments/trial`, {}).pipe(
      catchError(this.tratarErro)
    );
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    const mensagem = error.error?.erro || error.error?.message || error.message || 'Erro ao processar plano';
    return throwError(() => mensagem);
  }
}
