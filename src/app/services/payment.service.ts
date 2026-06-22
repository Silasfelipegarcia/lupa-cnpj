import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaymentHistoryItem } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private readonly apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarHistorico(): Observable<PaymentHistoryItem[]> {
    return this.http.get<PaymentHistoryItem[]>(`${this.apiBase}/payments/history`).pipe(
      catchError(this.tratarErro)
    );
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    const mensagem = error.error?.erro || error.error?.message || error.message || 'Erro ao carregar cobrança';
    return throwError(() => mensagem);
  }
}
