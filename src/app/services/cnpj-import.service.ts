import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ImportJobResponse } from '../models/import-job.model';

@Injectable({ providedIn: 'root' })
export class CnpjImportService {

  private readonly baseUrl = `${environment.apiUrl}/cnpj/import`;

  constructor(private http: HttpClient) {}

  iniciarImportacao(arquivo: File): Observable<ImportJobResponse> {
    const formData = new FormData();
    formData.append('file', arquivo, arquivo.name);

    return this.http.post<ImportJobResponse>(this.baseUrl, formData).pipe(
      catchError(this.tratarErro)
    );
  }

  consultarStatus(jobId: string): Observable<ImportJobResponse> {
    return this.http.get<ImportJobResponse>(`${this.baseUrl}/${jobId}/status`).pipe(
      catchError(this.tratarErro)
    );
  }

  baixarResultado(jobId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${jobId}/download`, {
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

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    const mensagem = error.error?.erro || 'Erro ao conectar com o servidor';
    return throwError(() => mensagem);
  }
}
