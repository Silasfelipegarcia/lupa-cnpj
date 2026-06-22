import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ImportJobResponse, ImportJobSummary } from '../models/import-job.model';
import { CnpjConfig } from '../models/cnpj-config.model';

interface ImportJobSummaryApi {
  jobId: string;
  status: string;
  arquivo: string;
  total: number;
  processados: number;
  sucesso: number;
  erros: number;
  percentual: number;
  mensagem: string;
  createdAt?: string;
  completedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CnpjImportService {

  private readonly apiBase = environment.apiUrl;
  private readonly importUrl = `${environment.apiUrl}/cnpj/import`;

  constructor(private http: HttpClient) {}

  obterConfiguracao(): Observable<CnpjConfig> {
    return this.http.get<CnpjConfig>(`${this.apiBase}/cnpj/config`).pipe(
      catchError(this.tratarErro)
    );
  }

  iniciarImportacao(arquivo: File): Observable<ImportJobResponse> {
    const formData = new FormData();
    formData.append('file', arquivo, arquivo.name);

    return this.http.post<ImportJobResponse>(this.importUrl, formData).pipe(
      catchError(this.tratarErro)
    );
  }

  consultarStatus(jobId: string): Observable<ImportJobResponse> {
    return this.http.get<ImportJobResponse>(`${this.importUrl}/${jobId}/status`).pipe(
      catchError(this.tratarErro)
    );
  }

  obterJobAtivo(): Observable<ImportJobResponse | null> {
    return this.http.get<ImportJobResponse>(`${this.importUrl}/ativo`, { observe: 'response' }).pipe(
      map((response) => (response.status === 204 ? null : response.body!)),
      catchError(this.tratarErro)
    );
  }

  obterHistorico(): Observable<ImportJobSummary[]> {
    return this.http.get<ImportJobSummaryApi[]>(`${this.importUrl}/historico`).pipe(
      map((items) => items.map((item) => this.normalizarResumo(item))),
      catchError(this.tratarErro)
    );
  }

  obterHistoricoDetalhe(jobId: string): Observable<ImportJobResponse> {
    return this.http.get<ImportJobResponse>(`${this.importUrl}/historico/${jobId}`).pipe(
      catchError(this.tratarErro)
    );
  }

  cancelarImportacao(jobId: string): Observable<ImportJobResponse> {
    return this.http.delete<ImportJobResponse>(`${this.importUrl}/${jobId}`).pipe(
      catchError(this.tratarErro)
    );
  }

  baixarResultado(jobId: string): Observable<Blob> {
    return this.http.get(`${this.importUrl}/${jobId}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.tratarErro)
    );
  }

  baixarModeloExcel(): Observable<Blob> {
    return this.http.get(`${this.apiBase}/cnpj/template`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.tratarErro)
    );
  }

  baixarBlob(blob: Blob, nomeArquivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private normalizarResumo(item: ImportJobSummaryApi): ImportJobSummary {
    return {
      jobId: String(item.jobId),
      status: item.status as ImportJobSummary['status'],
      arquivo: item.arquivo,
      total: item.total,
      processados: item.processados,
      sucesso: item.sucesso,
      erros: item.erros,
      percentual: item.percentual,
      mensagem: item.mensagem,
      createdAt: item.createdAt,
      completedAt: item.completedAt
    };
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    if (error.status === 429) {
      return throwError(() => 'Muitas requisições. Aguarde um momento e tente novamente.');
    }
    if (error.status === 403) {
      return throwError(() => error.error?.erro || 'Você não tem permissão para acessar esta consulta.');
    }
    const mensagem = error.error?.erro || 'Erro ao conectar com o servidor';
    return throwError(() => mensagem);
  }
}
