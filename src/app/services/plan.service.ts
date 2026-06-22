import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CheckoutRequest, CheckoutResponse, PlanCatalogItem, SubscriptionPlan } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class PlanService {

  private readonly apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarCatalogo(): Observable<PlanCatalogItem[]> {
    return this.http.get<PlanCatalogItem[]>(`${this.apiBase}/plans`).pipe(
      catchError(this.tratarErro)
    );
  }

  iniciarCheckout(plan: SubscriptionPlan): Observable<CheckoutResponse> {
    const body: CheckoutRequest = { plan };
    return this.http.post<CheckoutResponse>(`${this.apiBase}/payments/checkout`, body).pipe(
      catchError(this.tratarErro)
    );
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    const mensagem = error.error?.erro || error.error?.message || error.message || 'Erro ao processar plano';
    return throwError(() => mensagem);
  }
}
