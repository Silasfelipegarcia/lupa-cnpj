import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ImportJobResponse, ImportJobSummary, CnpjResultadoItem } from '../models/import-job.model';
import { CnpjConfig, DownloadFiltros, ListaSalva } from '../models/cnpj-config.model';
import { ImportCacheKey, ImportDataStore } from './import-data-store.service';

@Injectable({ providedIn: 'root' })
export class CnpjImportService {

  private readonly apiBase = environment.apiUrl;
  private readonly importUrl = `${environment.apiUrl}/cnpj/import`;
  private readonly store = inject(ImportDataStore);

  constructor(private http: HttpClient) {}

  invalidarCache(keys: ImportCacheKey | ImportCacheKey[]): void {
    this.store.invalidate(keys);
  }

  obterConfiguracao(force = false): Observable<CnpjConfig> {
    return this.store.getConfig(force);
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

  obterHistorico(force = false): Observable<ImportJobSummary[]> {
    return this.store.getHistorico(force);
  }

  obterHistoricoDetalhe(jobId: string): Observable<ImportJobResponse> {
    return this.http.get<ImportJobResponse>(`${this.importUrl}/historico/${jobId}`).pipe(
      catchError(this.tratarErro)
    );
  }

  listarListasSalvas(force = false): Observable<ListaSalva[]> {
    return this.store.getListasSalvas(force);
  }

  salvarLista(jobId: string, nomeLista: string): Observable<void> {
    return this.http.post<void>(`${this.importUrl}/${jobId}/salvar-lista`, { nomeLista }).pipe(
      catchError(this.tratarErro)
    );
  }

  reprocessar(jobId: string): Observable<ImportJobResponse> {
    return this.http.post<ImportJobResponse>(`${this.importUrl}/${jobId}/reprocessar`, {}).pipe(
      catchError(this.tratarErro)
    );
  }

  cancelarImportacao(jobId: string): Observable<ImportJobResponse> {
    return this.http.delete<ImportJobResponse>(`${this.importUrl}/${jobId}`).pipe(
      catchError(this.tratarErro)
    );
  }

  baixarResultado(jobId: string, format: 'csv' | 'xlsx' = 'csv', filtros?: DownloadFiltros): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filtros?.somenteAtivos) {
      params = params.set('somenteAtivos', 'true');
    }
    if (filtros?.uf) {
      params = params.set('uf', filtros.uf);
    }
    if (filtros?.cnae) {
      params = params.set('cnae', filtros.cnae);
    }
    if (filtros?.comTelefone) {
      params = params.set('comTelefone', 'true');
    }
    if (filtros?.comEmail) {
      params = params.set('comEmail', 'true');
    }

    return this.http.get(`${this.importUrl}/${jobId}/download`, {
      params,
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

  consultarCnpjDireto(cnpj: string): Observable<CnpjResultadoItem> {
    return this.http.get<CnpjResultadoItem>(`${this.apiBase}/cnpj/consulta`, {
      params: { cnpj }
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
    if (error.status === 429) {
      return throwError(() => 'Muitas requisições. Aguarde um momento e tente novamente.');
    }
    if (error.status === 403) {
      return throwError(() => error.error?.erro || 'Você não tem permissão para esta ação.');
    }
    const mensagem = error.error?.erro || 'Erro ao conectar com o servidor';
    return throwError(() => mensagem);
  }
}
