import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ImportJobSummary } from '../models/import-job.model';
import { CnpjConfig, ListaSalva } from '../models/cnpj-config.model';

export type ImportCacheKey = 'historico' | 'listas' | 'config' | 'all';

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
export class ImportDataStore {

  private static readonly TTL_MS = 60_000;

  private readonly importUrl = `${environment.apiUrl}/cnpj/import`;
  private readonly configUrl = `${environment.apiUrl}/cnpj/config`;

  private historicoCache?: { data: ImportJobSummary[]; etag: string | null; fetchedAt: number };
  private listasCache?: { data: ListaSalva[]; fetchedAt: number };
  private configCache?: { data: CnpjConfig; fetchedAt: number };

  constructor(private http: HttpClient) {}

  invalidate(keys: ImportCacheKey | ImportCacheKey[]): void {
    const list = keys === 'all' ? ['historico', 'listas', 'config'] as ImportCacheKey[] : [keys].flat();
    if (list.includes('all') || list.includes('historico')) {
      this.historicoCache = undefined;
    }
    if (list.includes('all') || list.includes('listas')) {
      this.listasCache = undefined;
    }
    if (list.includes('all') || list.includes('config')) {
      this.configCache = undefined;
    }
  }

  getHistorico(force = false): Observable<ImportJobSummary[]> {
    if (!force && this.historicoCache && this.isFresh(this.historicoCache.fetchedAt)) {
      return of(this.historicoCache.data);
    }

    let headers = new HttpHeaders();
    if (this.historicoCache?.etag) {
      headers = headers.set('If-None-Match', this.historicoCache.etag);
    }

    return this.http.get<ImportJobSummaryApi[]>(`${this.importUrl}/historico`, {
      headers,
      observe: 'response'
    }).pipe(
      map((response) => {
        if (response.status === 304 && this.historicoCache) {
          this.historicoCache = {
            ...this.historicoCache,
            fetchedAt: Date.now()
          };
          return this.historicoCache.data;
        }

        const etag = response.headers.get('ETag');
        const data = (response.body ?? []).map((item) => this.normalizarResumo(item));
        this.historicoCache = { data, etag, fetchedAt: Date.now() };
        return data;
      }),
      catchError(this.tratarErro)
    );
  }

  getListasSalvas(force = false): Observable<ListaSalva[]> {
    if (!force && this.listasCache && this.isFresh(this.listasCache.fetchedAt)) {
      return of(this.listasCache.data);
    }

    return this.http.get<ListaSalva[]>(`${this.importUrl}/listas-salvas`).pipe(
      map((data) => {
        this.listasCache = { data, fetchedAt: Date.now() };
        return data;
      }),
      catchError(this.tratarErro)
    );
  }

  getConfig(force = false): Observable<CnpjConfig> {
    if (!force && this.configCache) {
      return of(this.configCache.data);
    }

    return this.http.get<CnpjConfig>(this.configUrl).pipe(
      map((data) => {
        this.configCache = { data, fetchedAt: Date.now() };
        return data;
      }),
      catchError(this.tratarErro)
    );
  }

  private isFresh(fetchedAt: number): boolean {
    return Date.now() - fetchedAt < ImportDataStore.TTL_MS;
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
      return throwError(() => error.error?.erro || 'Você não tem permissão para esta ação.');
    }
    const mensagem = error.error?.erro || 'Erro ao conectar com o servidor';
    return throwError(() => mensagem);
  }
}
