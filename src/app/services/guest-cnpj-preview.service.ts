import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CnpjPreviewQuota, CnpjPreviewResult } from '../models/cnpj-preview.model';

@Injectable({ providedIn: 'root' })
export class GuestCnpjPreviewService {

  private readonly baseUrl = `${environment.apiUrl}/cnpj/preview`;

  constructor(private http: HttpClient) {}

  obterQuota(): Observable<CnpjPreviewQuota> {
    return this.http.get<CnpjPreviewQuota>(`${this.baseUrl}/quota`).pipe(
      catchError(this.tratarErro)
    );
  }

  consultar(cnpj: string): Observable<CnpjPreviewResult> {
    const digits = cnpj.replace(/\D/g, '');
    return this.http.get<CnpjPreviewResult>(this.baseUrl, {
      params: { cnpj: digits }
    }).pipe(
      catchError(this.tratarErro)
    );
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      return throwError(() => 'Consulta gratuita indisponível no momento. Tente novamente em instantes.');
    }
    if (error.status === 429) {
      return throwError(() => 'Muitas consultas. Aguarde um momento e tente novamente.');
    }
    const mensagem = error.error?.erro || 'Erro ao consultar CNPJ';
    return throwError(() => mensagem);
  }
}
